from flask import Flask, request, jsonify
from flask_cors import CORS
# Import the function from your existing classifier.py file
from classifier import classify_prompt

app = Flask(__name__)
# Enable CORS for all routes so React (on port 5173) can access this (on port 5000)
CORS(app)

@app.route('/api/classify', methods=['POST'])
def classify_endpoint():
    data = request.json
    
    if not data or 'prompt' not in data:
        return jsonify({"error": "No prompt provided"}), 400
    
    user_prompt = data['prompt']
    
    # --- The Bridge: Call your Python Logic ---
    ministry, confidence = classify_prompt(user_prompt)
    
    # Log it to the server console (so you can see it happening)
    print(f"Received: '{user_prompt}' -> Classified: {ministry} ({confidence:.2f})")
    
    return jsonify({
        "ministry": ministry,
        "confidence": confidence
    })

if __name__ == '__main__':
    print("Starting Flask Server on port 5000...")
    app.run(debug=True, port=5000)