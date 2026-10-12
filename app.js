document.addEventListener('DOMContentLoaded', () => {
    const screens = {
        home: document.getElementById('home-screen'),
        preview: document.getElementById('preview-screen'),
        processing: document.getElementById('processing-screen'),
        review: document.getElementById('review-screen'),
        success: document.getElementById('success-screen')
    };

    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-media-container');
    const reviewContainer = document.getElementById('review-media-container');

    let currentFile = null;
    let extractedDataCache = null;

    function showScreen(key) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        Object.values(screens).forEach(s => s.classList.add('hidden'));
        screens[key].classList.remove('hidden');
        screens[key].classList.add('active');
    }

    document.getElementById('btn-upload').addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            currentFile = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                let mediaHtml = currentFile.type === 'application/pdf'
                    ? `<embed src="${e.target.result}" type="application/pdf" width="100%" height="100%" />`
                    : `<img src="${e.target.result}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />`;

                previewContainer.innerHTML = mediaHtml;
                reviewContainer.innerHTML = mediaHtml;
                showScreen('preview');
            };
            reader.readAsDataURL(currentFile);
        }
    });

    document.getElementById('btn-retake').addEventListener('click', () => fileInput.click());

    const phrases = ["Reading text...", "Matching Patient Records...", "Extracting Amounts..."];
    document.getElementById('btn-confirm-upload').addEventListener('click', async () => {
        showScreen('processing');
        const dynText = document.getElementById('dynamic-text');
        let i = 0; const t = setInterval(() => { i = (i + 1) % phrases.length; dynText.innerText = phrases[i]; }, 800);

        try {
            const formData = new FormData(); formData.append('file', currentFile);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!res.ok) throw new Error("Upload Failed");
            extractedDataCache = await res.json();
            clearInterval(t);
            buildForm(extractedDataCache);
            showScreen('review');
        } catch (e) {
            clearInterval(t); alert("Backend Error"); showScreen('home');
        }
    });

    function buildForm(data) {
        const form = document.getElementById('extraction-form');
        form.innerHTML = '';
        const fields = data.extracted_data;
        const confs = data.confidence_scores;

        Object.keys(fields).forEach(key => {
            const val = fields[key];
            const conf = confs[key] || 100;
            const isHigh = conf > 70;
            const badgeClass = isHigh ? 'high' : 'low';
            const badgeText = isHigh ? `${conf}% MATCH` : `${conf}% MATCH - REVIEW`;

            let labelStr = key.replace('_', ' ').toUpperCase();
            if (key === 'procedure_test') labelStr = 'PROCEDURE / TEST';

            let helperHtml = '';
            if (!isHigh) {
                helperHtml = `<div class="field-helper">Verify the amount (Confidence < 70%) before approving.</div>`;
            }

            form.innerHTML += `
                <div class="form-group">
                    <label>${labelStr}</label>
                    <div class="input-wrapper">
                        <input type="text" id="field-${key}" value="${val}">
                        <div class="match-badge ${badgeClass}">${badgeText}</div>
                    </div>
                    ${helperHtml}
                </div>
            `;
        });

        if (fields['total_amount']) {
            document.getElementById('summary-total').value = fields['total_amount'].replace('₹', '').trim();
        }
    }

    document.getElementById('extraction-form').addEventListener('input', (e) => {
        if (e.target.id === 'field-total_amount') {
            document.getElementById('summary-total').value = e.target.value.replace('₹', '').trim();
        }
    });
    document.getElementById('summary-total').addEventListener('input', (e) => {
        const field = document.getElementById('field-total_amount');
        if (field) {
            field.value = `₹ ${e.target.value}`;
            // If user fixes the total amount, we should ideally trigger a re-validation or update the style.
            // For now, it stays synchronized.
        }
    });

    document.getElementById('btn-save-export').addEventListener('click', async () => {
        const payload = {};
        for (const k of Object.keys(extractedDataCache.extracted_data)) {
            const el = document.getElementById(`field-${k}`);
            payload[k] = el ? el.value : extractedDataCache.extracted_data[k];
        }
        try {
            document.getElementById('btn-save-export').innerText = "Saving...";
            const res = await fetch('/api/export', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
            if (!res.ok) throw new Error("Export failed");
            showScreen('success');
        } catch (e) {
            alert('Failed to save');
        } finally {
            document.getElementById('btn-save-export').innerText = "Approve & Save to FHIR";
        }
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        buildForm(extractedDataCache);
    });

    document.getElementById('btn-home').addEventListener('click', () => {
        fileInput.value = ''; currentFile = null; showScreen('home');
    });
});
