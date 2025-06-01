import os
import torch
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from torchvision.models import resnet50, ResNet50_Weights
from torchvision.datasets import ImageFolder
from torch.utils.data import DataLoader
from torchvision.transforms import Compose, Resize, ToTensor, Normalize
from tqdm import tqdm

# Define transformations for images
transform = Compose([
    Resize((224, 224)),  # Resize images to 224x224
    ToTensor(),          # Convert PIL images to PyTorch tensors
    Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])  # Normalize for ResNet
])

# Load dataset using ImageFolder
def load_dataset_lazy(root_dir, transform=transform):
    return ImageFolder(root=root_dir, transform=transform)

# Lazy feature extraction using ResNet50
def extract_features_lazy(dataset):
    resnet = resnet50(weights=ResNet50_Weights.IMAGENET1K_V1)
    resnet = torch.nn.Sequential(*list(resnet.children())[:-1])  # Remove classification layer
    resnet.eval()

    batch_size = 64
    features = []
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=False)

    with torch.no_grad():
        for batch, _ in tqdm(dataloader, desc="Extracting Features", unit="batch"):
            batch_features = resnet(batch).squeeze().cpu().numpy()  # Move to CPU to save GPU memory
            features.append(batch_features.astype('float16'))  # Reduce precision
    return np.vstack(features)

# Save features to disk
def save_features(features, filenames, filename):
    # Filter out missing files
    valid_filenames = [f for f in filenames if os.path.exists(f)]
    valid_features = features[[i for i, f in enumerate(filenames) if os.path.exists(f)]]
    
    # Extract relative paths from filenames
    relative_filenames = [os.path.relpath(f, start='data/train') for f in valid_filenames]
    
    # Normalize paths to use forward slashes
    normalized_filenames = [f.replace("\\", "/") for f in relative_filenames]
    
    np.savez_compressed(filename, features=valid_features, filenames=normalized_filenames)

# Load features from disk
def load_features(filename):
    data = np.load(filename)
    return data['features'], data['filenames']

# Compute cosine similarity
def find_similar_images(query_feature, features, top_k=5):
    similarities = cosine_similarity([query_feature], features).flatten()
    top_k_indices = np.argsort(similarities)[-top_k:][::-1]
    top_k_scores = similarities[top_k_indices]
    return top_k_indices, top_k_scores