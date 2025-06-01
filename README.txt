PAWLENS

This project allows users to upload images and compare them against a training dataset using image similarity techniques.

Follow these steps to set up and run the project on your local machine:

1. Clone the Repository

2. Activate the Virtual Environment

   myenv\Scripts\activate

   If 'myenv' doesn't exist, you can create it using:
   python -m venv myenv

3. Install Dependencies
   Install all the required Python packages using the requirements.txt file:

   pip install -r requirements.txt

4. Extract Features from Training Dataset
   Run the following script to load the training dataset and extract features for the training images:

   python extract_features.py

   Make sure to download the dataset from [https://www.kaggle.com/datasets/andrewmvd/animal-faces] and extract it into the data/ folder before running the feature extraction script.


5. Run the Web App
   Now, start the Flask server:

   python main.py

6. Open the Web App in Your Browser

   Once the server is running, check the terminal for the local address (usually something like http://127.0.0.1:XXXX/) and open it in your browser.



The structure of the project should look like this:
.
├── data/
│   ├── train/ ...
│   └── val/ ...
├── myenv/
├── static/
│   ├── *.png
│   ├── index.html
│   ├── script.js
│   └── style.css
├── extract_features.py
├── main.py
├── requirements.txt
├── train_features.npz
└── utils.py

