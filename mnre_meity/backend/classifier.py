import nltk
from nltk.classify import NaiveBayesClassifier
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import string

# --- 1. SETUP & DATA DOWNLOAD ---
# We need to ensure we have the basic NLTK data. 
# in a real app, you'd run these downloads during your build process.
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    nltk.download('punkt_tab')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

# --- 2. TRAINING DATA (The Brain) ---
# We provide labeled examples. The model learns patterns from these.
train_data = [
    # MNRE (Renewable Energy) Examples
    ("How do I apply for a solar rooftop subsidy?", "MNRE"),
    ("What are the guidelines for wind energy farms?", "MNRE"),
    ("biogas plant installation cost", "MNRE"),
    ("green hydrogen policy india", "MNRE"),
    ("national solar mission targets", "MNRE"),
    ("renewable energy certificates", "MNRE"),
    ("solar pump scheme for farmers (kusum)", "MNRE"),
    ("waste to energy projects", "MNRE"),
    ("subsidy for solar water heater", "MNRE"),
    ("offshore wind energy potential", "MNRE"),
    
    # MeiTY (Electronics & IT) Examples
    ("how to link aadhaar with mobile", "MeiTY"),
    ("digital india internship scheme", "MeiTY"),
    ("cyber security guidelines for startups", "MeiTY"),
    ("electronics manufacturing cluster emc", "MeiTY"),
    ("IT act section 66A details", "MeiTY"),
    ("software technology parks of india", "MeiTY"),
    ("semiconductor mission application", "MeiTY"),
    ("digilocker account issues", "MeiTY"),
    ("data protection bill status", "MeiTY"),
    ("csc common service center login", "MeiTY"),
    ("unified payment interface UPI transaction failed", "MeiTY")
]

# --- 3. FEATURE EXTRACTION ---
# This converts text into a format the algorithm understands (Bag of Words)
# It cleans the text (removes punctuation/stopwords) and tracks word presence.

stop_words = set(stopwords.words('english'))

def extract_features(text):
    # normalize: lowercase and remove punctuation
    text = text.lower().translate(str.maketrans('', '', string.punctuation))
    words = word_tokenize(text)
    
    # Create a dictionary of words present in this text
    # We remove common "stop words" (is, the, a) to focus on keywords
    features = {}
    for word in words:
        if word not in stop_words:
            features[word] = True
    return features

# --- 4. TRAINING THE MODEL ---
print("Training model...")
# Convert our raw list of strings into a list of (features, label) tuples
training_features = [(extract_features(text), label) for (text, label) in train_data]

# Train the Naive Bayes Classifier
classifier = NaiveBayesClassifier.train(training_features)
print("Model trained successfully!\n")

# --- 5. PREDICTION FUNCTION ---
def classify_prompt(prompt):
    # 1. Process input
    features = extract_features(prompt)
    
    # 2. Get the label
    label = classifier.classify(features)
    
    # 3. Get confidence score (Probability)
    prob_dist = classifier.prob_classify(features)
    confidence = prob_dist.prob(label)
    
    return label, confidence

# --- 6. INTERACTIVE LOOP (For Testing) ---
if __name__ == "__main__":
    print("-" * 50)
    print(" MINISTRY CLASSIFIER (Type 'exit' to quit)")
    print("-" * 50)
    
    # Example showing important features
    # classifier.show_most_informative_features(5)

    while True:
        user_input = input("Enter your query: ")
        if user_input.lower() in ['exit', 'quit']:
            break
        
        ministry, conf = classify_prompt(user_input)
        
        # Simple threshold logic: if confidence is too low, maybe it's neither
        if conf < 0.6: 
            result = f"Unsure (Leaning {ministry}, {conf:.2f})"
        else:
            result = f"{ministry} ({conf:.2f})"
            
        print(f" >> Classified as: {result}\n")