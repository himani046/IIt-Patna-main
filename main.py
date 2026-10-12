from fastapi import FastAPI, File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import time
import asyncio

app = FastAPI(title="Healthcare Scanner API")

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    # Simulate processing delay
    await asyncio.sleep(2.0)
    
    # Mock extracted structured data matching the requested UI design
    mock_data = {
        "extracted_data": {
            "patient_name": "Rahul Sharma",
            "procedure_test": "Complete Blood Count",
            "total_amount": "₹ 850"
        },
        "confidence_scores": {
            "patient_name": 98,
            "procedure_test": 92,
            "total_amount": 65
        }
    }
    return JSONResponse(content=mock_data)

@app.post("/api/export")
async def export_data(data: dict):
    # Simulate processing delay
    await asyncio.sleep(1.0)
    fhir_response = {
        "resourceType": "Bundle",
        "type": "document",
        "entry": [
            {
                "resource": {
                    "resourceType": "Patient",
                    "identifier": data
                }
            }
        ],
        "message": "Successfully exported to FHIR format"
    }
    return JSONResponse(content={"status": "success", "fhir_data": fhir_response})

# Mount the frontend directory to serve static files
app.mount("/", StaticFiles(directory="../frontend", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
