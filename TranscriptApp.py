from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import requests
from youtube_transcript_api import YouTubeTranscriptApi
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
import numpy as np
from transformers import pipeline

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
    nltk.download('omw-1.4', quiet=True)
except:
    pass

app = Flask(__name__)
CORS(app)

# Initialize the summarization pipeline
try:
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
except:
    summarizer = None

class TranscriptSummarizer:
    def __init__(self):
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
    
    def extract_video_id(self, url):
        """Extract video ID from YouTube URL"""
        patterns = [
            r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([^&\n?#]+)',
            r'youtube\.com/v/([^&\n?#]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None
    
    def get_transcript(self, video_id):
        """Get transcript from YouTube video"""
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            transcript = ' '.join([item['text'] for item in transcript_list])
            return transcript
        except Exception as e:
            # Try to get transcript in different languages
            try:
                transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                transcript = transcript_list.find_transcript(['en', 'en-US', 'en-GB'])
                transcript_data = transcript.fetch()
                transcript = ' '.join([item['text'] for item in transcript_data])
                return transcript
            except:
                return None
    
    def preprocess_text(self, text):
        """Preprocess text by removing special characters and lemmatizing"""
        # Remove special characters and convert to lowercase
        text = re.sub(r'[^a-zA-Z\s]', '', text.lower())
        
        # Tokenize
        tokens = word_tokenize(text)
        
        # Remove stop words and lemmatize
        tokens = [self.lemmatizer.lemmatize(token) for token in tokens 
                 if token not in self.stop_words and len(token) > 2]
        
        return ' '.join(tokens)
    
    def lsa_summarization(self, text, max_sentences=5):
        """Perform LSA-based extractive summarization"""
        sentences = sent_tokenize(text)
        
        if len(sentences) <= max_sentences:
            return text
        
        # Preprocess sentences
        processed_sentences = [self.preprocess_text(sentence) for sentence in sentences]
        
        # Create TF-IDF matrix
        vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(processed_sentences)
        
        # Apply LSA
        lsa = TruncatedSVD(n_components=min(10, len(sentences)), random_state=42)
        lsa_matrix = lsa.fit_transform(tfidf_matrix)
        
        # Calculate sentence scores
        sentence_scores = np.sum(lsa_matrix, axis=1)
        
        # Get top sentences
        top_sentence_indices = np.argsort(sentence_scores)[-max_sentences:]
        top_sentence_indices = sorted(top_sentence_indices)
        
        summary = ' '.join([sentences[i] for i in top_sentence_indices])
        return summary
    
    def transformer_summarization(self, text, max_length=150):
        """Perform transformer-based abstractive summarization"""
        if summarizer is None:
            return self.lsa_summarization(text)
        
        try:
            # Split text into chunks if too long
            max_chunk_length = 1024
            chunks = [text[i:i+max_chunk_length] for i in range(0, len(text), max_chunk_length)]
            
            summaries = []
            for chunk in chunks:
                if len(chunk.strip()) > 50:  # Only summarize non-empty chunks
                    summary = summarizer(chunk, max_length=max_length, min_length=30, do_sample=False)
                    summaries.append(summary[0]['summary_text'])
            
            return ' '.join(summaries)
        except Exception as e:
            print(f"Transformer summarization failed: {e}")
            return self.lsa_summarization(text)
    
    def summarize_transcript(self, video_url, max_length=150, method='auto'):
        """Main function to summarize YouTube transcript"""
        # Extract video ID
        video_id = self.extract_video_id(video_url)
        if not video_id:
            return {"error": "Invalid YouTube URL"}
        
        # Get transcript
        transcript = self.get_transcript(video_id)
        if not transcript:
            return {"error": "Could not retrieve transcript for this video"}
        
        # Choose summarization method based on transcript length
        if method == 'auto':
            if len(transcript) > 5000:
                method = 'lsa'
            else:
                method = 'transformer'
        
        # Summarize
        if method == 'lsa':
            summary = self.lsa_summarization(transcript, max_sentences=max_length//20)
        else:
            summary = self.transformer_summarization(transcript, max_length=max_length)
        
        return {
            "summary": summary,
            "original_length": len(transcript),
            "summary_length": len(summary),
            "method_used": method
        }

# Initialize summarizer
transcript_summarizer = TranscriptSummarizer()

@app.route('/summarize', methods=['POST'])
def summarize_video():
    """API endpoint to summarize YouTube video transcript"""
    try:
        data = request.get_json()
        video_url = data.get('video_url')
        max_length = data.get('max_length', 150)
        method = data.get('method', 'auto')
        
        if not video_url:
            return jsonify({"error": "Video URL is required"}), 400
        
        result = transcript_summarizer.summarize_transcript(video_url, max_length, method)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "YouTube Transcript Summarizer API is running"}), 200

@app.route('/', methods=['GET'])
def home():
    """Home endpoint"""
    return jsonify({
        "message": "YouTube Transcript Summarizer API",
        "endpoints": {
            "/summarize": "POST - Summarize YouTube video transcript",
            "/health": "GET - Health check"
        }
    }), 200

if __name__ == '__main__':
    print("Starting YouTube Transcript Summarizer API...")
    print("Server will be available at http://127.0.0.1:5000/")
    app.run(debug=True, host='127.0.0.1', port=5000)