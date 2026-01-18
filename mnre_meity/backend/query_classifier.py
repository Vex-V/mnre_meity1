from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os

app = Flask(__name__)
CORS(app)  


OPENAI_API_KEY=""
client = OpenAI(api_key=OPENAI_API_KEY)

def classify_query(query: str) -> str:
    prompt = (
        "Classify the following query into exactly one of these categories:\n"
        "- MEiTY (Ministry of Electronics and Information Technology)\n"
        "- MNRE (Ministry of New and Renewable Energy)\n"
        "- unclassified\n\n"
        "Respond with only one word: meity, mnre, or unclassified.\n\n"
        f"Query: {query}"
    )

    response = client.responses.create(
        model="gpt-4o-mini",
        input=prompt,
        temperature=0
    )

    return response.output_text.strip().lower()

@app.route('/classify', methods=['POST'])
def classify_endpoint():
    data = request.json
    
    if not data or 'query' not in data:
        return jsonify({"error": "No query provided"}), 400
    
    user_query = data['query']
    print(f"Received query: {user_query}")
    
    # Run the classification
    result = classify_query(user_query)
    print(f"Classified as: {result}")
    
    return jsonify({
        "ministry": result.upper(), # 'MNRE', 'MEITY', or 'UNCLASSIFIED'
        "original_query": user_query
    })

if __name__ == '__main__':
    print("Server running on http://localhost:5000")
    app.run(port=5000, debug=True)
