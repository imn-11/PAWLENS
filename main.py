from flask import Flask, request, jsonify, send_from_directory
import os
import numpy as np
import torch
from utils import load_features, find_similar_images
from PIL import Image
from torchvision.transforms import Compose, Resize, ToTensor, Normalize
from torchvision.models import resnet50, ResNet50_Weights

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load precomputed features
try:
    print("Loading precomputed features...")
    train_features, train_filenames = load_features('train_features.npz')
except FileNotFoundError:
    print("Precomputed features not found. Please extract features first.")
    exit(1)

# Check if file extension is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Serve the home page (index.html)
@app.route('/')
def home():
    return send_from_directory('static', 'index.html')

# Serve uploaded images
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Serve images from the dataset
@app.route('/data/<path:filename>')
def serve_image(filename):
    # Base directory for training images
    base_dir = 'data/train'
    
    # Remove any duplicate 'train/' prefixes and normalize the path
    clean_filename = filename.replace("train/", "").replace("\\", "/").lstrip("/")
    
    # Construct the full file path
    full_path = os.path.join(base_dir, clean_filename)
    
    # Check if the file exists
    if not os.path.exists(full_path):
        return "Image not found", 404
    
    return send_from_directory(base_dir, clean_filename)

# Upload and search endpoint
@app.route('/search', methods=['POST'])
def search():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and allowed_file(file.filename):
        # Save the uploaded file
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        
        # Preprocess the uploaded image
        image = Image.open(filepath).convert('RGB')
        preprocess = Compose([
            Resize((224, 224)),  # Resize to match ResNet input size
            ToTensor(),          # Convert to PyTorch tensor
            Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])  # Normalize for ResNet
        ])
        query_image = preprocess(image).unsqueeze(0)  # Add batch dimension
        
        # Extract features using a pre-trained ResNet50 model
        resnet = resnet50(weights=ResNet50_Weights.IMAGENET1K_V1)
        resnet = torch.nn.Sequential(*list(resnet.children())[:-1])  # Remove classification layer
        resnet.eval()
        with torch.no_grad():
            query_feature = resnet(query_image).squeeze().detach().cpu().numpy().astype('float16')

        # Find similar images based on cosine similarity
        similar_indices, similar_scores = find_similar_images(query_feature, train_features, top_k=5)
        
        # Generate URLs for similar images
        similar_images_with_urls = []
        for j, i in enumerate(similar_indices):
            normalized_path = train_filenames[i].replace("\\", "/")  # Normalize path
            similar_images_with_urls.append({
                "url": f"/data/{normalized_path}",
                "score": round(similar_scores[j], 2)
            })

        # Return results as JSON
        return jsonify({
            "query_image": f"/uploads/{file.filename}",
            "similar_images": similar_images_with_urls
        })

    return jsonify({"error": "Invalid file"}), 400

if __name__ == '__main__':
    app.run(debug=True)