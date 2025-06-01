# extract_features.py
from utils import load_dataset_lazy, extract_features_lazy, save_features

# Load the training dataset
print("Loading training dataset...")
train_dataset = load_dataset_lazy('data/train')

# Extract features for the training images
print("Extracting features for training images...")
train_features = extract_features_lazy(train_dataset)

# Save the features to disk
print("Saving features to disk...")
save_features(train_features, [img[0] for img in train_dataset.imgs], 'train_features.npz')