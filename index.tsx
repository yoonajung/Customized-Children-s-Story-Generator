/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from '@google/genai';
import { useState, useCallback, useRef, Fragment } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [name, setName] = useState('');
  const [age, setAge] = useState(5);
  const [interests, setInterests] = useState('');

  const [story, setStory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState(null);

  const utteranceRef = useRef(null);

  const handleGenerateStory = useCallback(async (e) => {
    e.preventDefault();
    if (!name || !interests) {
      setError('Please fill in the child\'s name and interests.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setStory('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `You are a whimsical and creative storyteller for young children. Your stories are always positive, encouraging, and filled with wonder. They should be easy for a child to understand and should gently weave in a positive message about friendship, courage, or curiosity.`;
      const prompt = `Create a short, magical story for ${name}, who is ${age} years old and loves ${interests}. Make sure ${name} is the hero of the story.`;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      let fullStory = '';
      for await (const chunk of responseStream) {
        fullStory += chunk.text;
        setStory(fullStory);
      }
    } catch (err) {
      console.error(err);
      setError('Sorry, something went wrong while creating the story. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [name, age, interests]);

  const handleReadAloud = useCallback(() => {
    if (isReading || !story) return;
    
    const utterance = new SpeechSynthesisUtterance(story);
    utterance.onend = () => {
      setIsReading(false);
      utteranceRef.current = null;
    };
    utterance.onerror = () => {
        setError('Sorry, an error occurred with the text-to-speech service.');
        setIsReading(false);
    };
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsReading(true);
  }, [story, isReading]);

  const handleStopReading = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      utteranceRef.current = null;
    }
  }, []);

  const highlightName = (text, nameToHighlight) => {
    if (!nameToHighlight.trim()) return text;
    const regex = new RegExp(`(${nameToHighlight})`, 'gi');
    return text.split(regex).map((part, index) =>
      part.toLowerCase() === nameToHighlight.toLowerCase() ? (
        <strong key={index}>{part}</strong>
      ) : (
        <Fragment key={index}>{part}</Fragment>
      )
    );
  };

  return (
    <>
      <h1 className="title">Customized Children's Story Generator</h1>
      <main className="container">
        <div className="form-container">
          <form className="story-form" onSubmit={handleGenerateStory}>
            <div className="form-group">
              <label htmlFor="name">Child's Name:</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Lily"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="age">Child's Age:</label>
              <select id="age" value={age} onChange={(e) => setAge(Number(e.target.value))}>
                {[...Array(8)].map((_, i) => (
                  <option key={i + 3} value={i + 3}>{i + 3} years old</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="interests">What do they love?</label>
              <input
                id="interests"
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g., brave knights and friendly dragons"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isLoading} aria-busy={isLoading}>
              {isLoading ? 'Creating Magic...' : 'Write my Story!'}
            </button>
          </form>
        </div>
        <section className="story-container" aria-live="polite">
          {!story && !isLoading && (
            <div className="story-placeholder">
              <p>Your magical story will appear here...</p>
            </div>
          )}
          {isLoading && !story && (
             <div className="story-placeholder">
              <p>Our storytellers are busy writing a special tale...</p>
            </div>
          )}
          {story && (
            <>
              <div className="story-controls">
                <button
                  onClick={isReading ? handleStopReading : handleReadAloud}
                  className="btn btn-secondary"
                  disabled={isLoading}
                >
                  {isReading ? 'Stop Reading' : 'Read Aloud'}
                </button>
              </div>
              <div className="story-content" aria-atomic="true">
                {highlightName(story, name)}
              </div>
            </>
          )}
          {error && <p className="error-message">{error}</p>}
        </section>
      </main>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
