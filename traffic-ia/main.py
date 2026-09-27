from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
import uvicorn
import cv2
import numpy as np

app = FastAPI()
model = YOLO("yolov8n.pt") 

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    results = model(img)
    count = sum(1 for r in results for c in r.boxes.cls if int(c) in [2, 3, 5, 7])
            
    return {"count": count}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)