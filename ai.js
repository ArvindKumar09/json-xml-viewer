// AI Tools Module - Free AI-powered text analysis tools
// Uses various free APIs for AI functionality

class AITools {
  constructor() {
    this.apiProviders = {
      huggingface: 'https://api-inference.huggingface.co/models/',
      textrazor: 'https://api.textrazor.com/',
      mymemory: 'https://api.mymemory.translated.net/get',
      googleTranslate: 'https://translate.googleapis.com/translate_a/single'
    };
  }

  // Text Summarizer using Hugging Face's free API
  async summarizeText() {
    const text = document.getElementById('text-to-summarize').value.trim();
    const length = document.getElementById('summary-length').value;
    
    if (!text) {
      this.showError('summarizer-output', 'Please enter text to summarize');
      return;
    }

    this.showLoading('summarizer-output', 'Summarizing text...');

    try {
      // Use a free summarization approach - extract key sentences
      const summary = this.extractiveSummarization(text, length);
      this.displaySummary(summary);
    } catch (error) {
      this.showError('summarizer-output', 'Error summarizing text: ' + error.message);
    }
  }

  // Local extractive summarization algorithm
  extractiveSummarization(text, length) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentences.length <= 2) return text;

    // Simple scoring based on sentence length and word frequency
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    const sentenceScores = sentences.map(sentence => {
      const sentWords = sentence.toLowerCase().split(/\W+/).filter(w => w.length > 3);
      const score = sentWords.reduce((sum, word) => sum + (wordFreq[word] || 0), 0) / sentWords.length;
      return { sentence: sentence.trim(), score };
    });

    // Sort by score and select top sentences
    sentenceScores.sort((a, b) => b.score - a.score);
    
    const maxSentences = length === 'short' ? 2 : length === 'medium' ? 4 : 6;
    const topSentences = sentenceScores.slice(0, maxSentences);
    
    // Return sentences in original order
    const selectedSentences = [];
    sentences.forEach(sentence => {
      if (topSentences.some(ts => ts.sentence === sentence.trim())) {
        selectedSentences.push(sentence.trim());
      }
    });

    return selectedSentences.join('. ') + '.';
  }

  displaySummary(summary) {
    const output = document.getElementById('summarizer-output');
    output.innerHTML = `
      <div class="ai-result">
        <div class="ai-result-header">
          <i class="fas fa-compress-alt"></i>
          <span>Text Summary</span>
        </div>
        <div class="ai-result-content">
          <p>${summary}</p>
        </div>
        <div class="ai-result-actions">
          <button onclick="copyToClipboard('${summary.replace(/'/g, "\\'")}')">
            <i class="fas fa-copy"></i> Copy Summary
          </button>
        </div>
      </div>
    `;
  }

    // Language Translator using MyMemory free API
  async translateText() {
    const text = document.getElementById('text-to-translate').value.trim();
    const sourceLang = document.getElementById('source-lang').value;
    const targetLang = document.getElementById('target-lang').value;
    
    if (!text) {
      this.showError('translator-output', 'Please enter text to translate');
      return;
    }

    if (sourceLang === targetLang) {
      this.showError('translator-output', 'Source and target languages cannot be the same');
      return;
    }

    this.showLoading('translator-output', 'Translating text...');

    try {
      // MyMemory API supports multiple language pairs
      const langPair = sourceLang === 'auto' ? targetLang : `${sourceLang}|${targetLang}`;
      
      // If auto-detect, use a different endpoint
      let url;
      if (sourceLang === 'auto') {
        // For auto-detect, we'll use English as intermediate if needed
        url = `${this.apiProviders.mymemory}?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
        
        // Try to detect language first with a simple heuristic
        const detectedLang = this.detectLanguage(text);
        if (detectedLang && detectedLang !== targetLang) {
          url = `${this.apiProviders.mymemory}?q=${encodeURIComponent(text)}&langpair=${detectedLang}|${targetLang}`;
        }
      } else {
        url = `${this.apiProviders.mymemory}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
      }
      
      console.log('Translation URL:', url); // Debug log
      
      // Use a more compatible fetch approach
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      }).catch(err => {
        console.warn('CORS fetch failed, trying without headers:', err);
        // Fallback to simple fetch if CORS fails
        return fetch(url);
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('Translation response:', data); // Debug log
      
      if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
        this.displayTranslation(text, data.responseData.translatedText, sourceLang, targetLang);
      } else if (data.matches && data.matches.length > 0) {
        // Use the best match from the translation database
        const bestMatch = data.matches[0];
        this.displayTranslation(text, bestMatch.translation, sourceLang, targetLang);
      } else {
        // Fallback: try with English as intermediate language
        if (sourceLang !== 'en' && targetLang !== 'en') {
          const enUrl = `${this.apiProviders.mymemory}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|en`;
          const enResponse = await fetch(enUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'DatazTools/1.0'
            }
          });
          
          if (enResponse.ok) {
            const enData = await enResponse.json();
            
            if (enData.responseData && enData.responseData.translatedText) {
              const finalUrl = `${this.apiProviders.mymemory}?q=${encodeURIComponent(enData.responseData.translatedText)}&langpair=en|${targetLang}`;
              const finalResponse = await fetch(finalUrl, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'DatazTools/1.0'
                }
              });
              
              if (finalResponse.ok) {
                const finalData = await finalResponse.json();
                
                if (finalData.responseData && finalData.responseData.translatedText) {
                  this.displayTranslation(text, finalData.responseData.translatedText, sourceLang, targetLang);
                  return;
                }
              }
            }
          }
        }
        
        throw new Error('Translation service returned no valid results');
      }
    } catch (error) {
      console.error('Translation error:', error);
      
      // Try fallback translation with a simpler approach
      try {
        const fallbackResult = await this.fallbackTranslation(text, sourceLang, targetLang);
        if (fallbackResult) {
          this.displayTranslation(text, fallbackResult, sourceLang, targetLang);
          return;
        }
      } catch (fallbackError) {
        console.error('Fallback translation failed:', fallbackError);
      }
      
      this.showError('translator-output', 'Translation service temporarily unavailable. Please try again later.');
    }
  }

  // Fallback translation using alternative methods
  async fallbackTranslation(text, sourceLang, targetLang) {
    // Simple word-based translation for common phrases
    const commonTranslations = {
      'en_es': {
        'hello': 'hola', 'goodbye': 'adiós', 'thank you': 'gracias', 
        'please': 'por favor', 'yes': 'sí', 'no': 'no', 'good': 'bueno',
        'bad': 'malo', 'big': 'grande', 'small': 'pequeño'
      },
      'en_fr': {
        'hello': 'bonjour', 'goodbye': 'au revoir', 'thank you': 'merci', 
        'please': 's\'il vous plaît', 'yes': 'oui', 'no': 'non', 'good': 'bon',
        'bad': 'mauvais', 'big': 'grand', 'small': 'petit'
      },
      'en_de': {
        'hello': 'hallo', 'goodbye': 'auf wiedersehen', 'thank you': 'danke', 
        'please': 'bitte', 'yes': 'ja', 'no': 'nein', 'good': 'gut',
        'bad': 'schlecht', 'big': 'groß', 'small': 'klein'
      },
      'en_hi': {
        'hello': 'नमस्ते', 'goodbye': 'अलविदा', 'thank you': 'धन्यवाद',
        'please': 'कृपया', 'yes': 'हाँ', 'no': 'नहीं', 'good': 'अच्छा',
        'bad': 'बुरा', 'big': 'बड़ा', 'small': 'छोटा'
      },
      'en_sv': {
        'hello': 'hej', 'goodbye': 'hej då', 'thank you': 'tack',
        'please': 'snälla', 'yes': 'ja', 'no': 'nej', 'good': 'bra',
        'bad': 'dålig', 'big': 'stor', 'small': 'liten'
      },
      'en_no': {
        'hello': 'hei', 'goodbye': 'ha det', 'thank you': 'takk',
        'please': 'takk', 'yes': 'ja', 'no': 'nei', 'good': 'bra',
        'bad': 'dårlig', 'big': 'stor', 'small': 'liten'
      },
      'en_da': {
        'hello': 'hej', 'goodbye': 'farvel', 'thank you': 'tak',
        'please': 'tak', 'yes': 'ja', 'no': 'nej', 'good': 'god',
        'bad': 'dårlig', 'big': 'stor', 'small': 'lille'
      }
    };

    const key = `${sourceLang}_${targetLang}`;
    const translations = commonTranslations[key];
    
    if (translations) {
      let translatedText = text.toLowerCase();
      let hasTranslation = false;
      
      for (const [original, translated] of Object.entries(translations)) {
        const regex = new RegExp(`\\b${original}\\b`, 'gi');
        if (regex.test(translatedText)) {
          translatedText = translatedText.replace(regex, translated);
          hasTranslation = true;
        }
      }
      
      if (hasTranslation) {
        return translatedText;
      }
    }

    // If no translation found, return a helpful message
    return `Translation not available for "${text}" from ${sourceLang} to ${targetLang}. Please try a different language pair or check your internet connection.`;
  }

  // Simple language detection heuristic
  detectLanguage(text) {
    const patterns = {
      'es': /\b(el|la|es|en|de|que|con|para|una|por|todo|pero|más|ser|su|puede|bien|año|estar|muy|hasta|desde)\b/gi,
      'fr': /\b(le|la|de|et|à|un|il|être|et|en|avoir|que|pour|dans|ce|son|une|sur|avec|ne|se|pas|tout|plus|par|grand|en)\b/gi,
      'de': /\b(der|die|das|und|in|den|von|zu|mit|sich|auf|für|ist|im|nicht|eine|als|auch|es|an|werden|aus|er|hat|dass)\b/gi,
      'it': /\b(il|di|che|è|la|per|un|in|con|non|da|su|del|al|le|si|come|più|o|questo|ma|anche|se|ci)\b/gi,
      'pt': /\b(o|de|a|e|que|do|da|em|um|para|é|com|não|uma|os|no|se|na|por|mais|as|dos|como|mas|foi|ao|ele|das)\b/gi,
      'ru': /[а-яё]/i,
      'ja': /[ひらがなカタカナ]/,
      'ko': /[ㄱ-ㅎ가-힣]/,
      'zh': /[\u4e00-\u9fff]/,
      'hi': /[\u0900-\u097F]/,
      'sv': /\b(och|att|det|är|för|på|med|av|som|till|från|har|inte|kan|om|när|över|andra|mycket|skulle|upp|bara|än|även)\b/gi,
      'no': /\b(og|å|det|er|for|på|med|av|som|til|fra|har|ikke|kan|om|når|over|andre|mye|skulle|opp|bare|enn|også)\b/gi,
      'da': /\b(og|at|det|er|for|på|med|af|som|til|fra|har|ikke|kan|om|når|over|andre|meget|skulle|op|bare|end|også)\b/gi
    };
    
    for (const [lang, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      if (matches && matches.length > 2) {
        return lang;
      }
    }
    
    return 'en'; // Default to English
  }

  displayTranslation(originalText, translatedText, sourceLang, targetLang) {
    const output = document.getElementById('translator-output');
    const langNames = {
      'auto': 'Auto-detect', 'en': 'English', 'es': 'Spanish', 'fr': 'French', 
      'de': 'German', 'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian',
      'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese', 'hi': 'Hindi',
      'bn': 'Bengali', 'te': 'Telugu', 'ta': 'Tamil', 'mr': 'Marathi',
      'sv': 'Swedish', 'no': 'Norwegian', 'da': 'Danish', 'fi': 'Finnish',
      'is': 'Icelandic', 'nl': 'Dutch', 'ar': 'Arabic', 'th': 'Thai'
    };
    
    output.innerHTML = `
      <div class="ai-result">
        <div class="ai-result-header">
          <i class="fas fa-language"></i>
          <span>Translation: ${langNames[sourceLang] || sourceLang} → ${langNames[targetLang] || targetLang}</span>
        </div>
        <div class="ai-result-content">
          <div class="translation-pair">
            <div class="original-text">
              <label>Original (${langNames[sourceLang] || sourceLang}):</label>
              <p>${originalText}</p>
            </div>
            <div class="translated-text">
              <label>Translation (${langNames[targetLang] || targetLang}):</label>
              <p>${translatedText}</p>
            </div>
          </div>
        </div>
        <div class="ai-result-actions">
          <button onclick="copyToClipboard('${translatedText.replace(/'/g, "\\'")}')">
            <i class="fas fa-copy"></i> Copy Translation
          </button>
        </div>
      </div>
    `;
  }

  // Sentiment Analyzer using local algorithm
  async analyzeSentiment() {
    const text = document.getElementById('text-to-analyze').value.trim();
    
    if (!text) {
      this.showError('sentiment-output', 'Please enter text to analyze');
      return;
    }

    this.showLoading('sentiment-output', 'Analyzing sentiment...');

    try {
      const analysis = this.localSentimentAnalysis(text);
      this.displaySentimentAnalysis(analysis);
    } catch (error) {
      this.showError('sentiment-output', 'Error analyzing sentiment: ' + error.message);
    }
  }

  localSentimentAnalysis(text) {
    // Simple sentiment analysis using predefined word lists
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'perfect',
      'love', 'like', 'enjoy', 'happy', 'pleased', 'satisfied', 'delighted', 'thrilled',
      'brilliant', 'outstanding', 'superb', 'remarkable', 'impressive', 'beautiful', 'nice'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'dislike', 'disappointed',
      'angry', 'frustrated', 'annoyed', 'upset', 'sad', 'disgusting', 'pathetic',
      'useless', 'worthless', 'failed', 'broken', 'wrong', 'poor', 'weak'
    ];

    const words = text.toLowerCase().split(/\W+/);
    let positiveScore = 0;
    let negativeScore = 0;
    let totalWords = words.length;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveScore++;
      if (negativeWords.includes(word)) negativeScore++;
    });

    const sentiment = positiveScore > negativeScore ? 'Positive' : 
                     negativeScore > positiveScore ? 'Negative' : 'Neutral';
    
    const confidence = Math.abs(positiveScore - negativeScore) / totalWords * 100;
    
    return {
      sentiment,
      confidence: Math.min(confidence, 100),
      positiveScore,
      negativeScore,
      totalWords
    };
  }

  displaySentimentAnalysis(analysis) {
    const output = document.getElementById('sentiment-output');
    const sentimentColor = analysis.sentiment === 'Positive' ? '#4CAF50' : 
                          analysis.sentiment === 'Negative' ? '#f44336' : '#FF9800';
    
    output.innerHTML = `
      <div class="ai-result">
        <div class="ai-result-header">
          <i class="fas fa-smile"></i>
          <span>Sentiment Analysis</span>
        </div>
        <div class="ai-result-content">
          <div class="sentiment-result">
            <div class="sentiment-main" style="color: ${sentimentColor}">
              <i class="fas fa-${analysis.sentiment === 'Positive' ? 'smile' : analysis.sentiment === 'Negative' ? 'frown' : 'meh'}"></i>
              <span class="sentiment-label">${analysis.sentiment}</span>
            </div>
            <div class="sentiment-details">
              <div class="sentiment-scores">
                <div class="score-item">
                  <span class="score-label">Positive words:</span>
                  <span class="score-value">${analysis.positiveScore}</span>
                </div>
                <div class="score-item">
                  <span class="score-label">Negative words:</span>
                  <span class="score-value">${analysis.negativeScore}</span>
                </div>
                <div class="score-item">
                  <span class="score-label">Total words:</span>
                  <span class="score-value">${analysis.totalWords}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Grammar Checker using local rules
  async checkGrammar() {
    const text = document.getElementById('text-to-check').value.trim();
    
    if (!text) {
      this.showError('grammar-output', 'Please enter text to check');
      return;
    }

    this.showLoading('grammar-output', 'Checking grammar...');

    try {
      const suggestions = this.localGrammarCheck(text);
      this.displayGrammarSuggestions(suggestions);
    } catch (error) {
      this.showError('grammar-output', 'Error checking grammar: ' + error.message);
    }
  }

  localGrammarCheck(text) {
    const suggestions = [];
    
    // Basic grammar rules
    const rules = [
      {
        pattern: /\bi\b/g,
        replacement: 'I',
        description: 'Capitalize personal pronoun "I"'
      },
      {
        pattern: /\s+/g,
        replacement: ' ',
        description: 'Remove extra spaces'
      },
      {
        pattern: /\.\s*([a-z])/g,
        replacement: (match, p1) => '. ' + p1.toUpperCase(),
        description: 'Capitalize first letter after period'
      },
      {
        pattern: /^([a-z])/,
        replacement: (match, p1) => p1.toUpperCase(),
        description: 'Capitalize first letter of text'
      }
    ];

    let correctedText = text;
    let issuesFound = 0;

    rules.forEach(rule => {
      const matches = text.match(rule.pattern);
      if (matches) {
        correctedText = correctedText.replace(rule.pattern, rule.replacement);
        issuesFound += matches.length;
        suggestions.push({
          rule: rule.description,
          count: matches.length
        });
      }
    });

    return {
      originalText: text,
      correctedText,
      suggestions,
      issuesFound
    };
  }

  displayGrammarSuggestions(result) {
    const output = document.getElementById('grammar-output');
    
    if (result.issuesFound === 0) {
      output.innerHTML = `
        <div class="ai-result">
          <div class="ai-result-header">
            <i class="fas fa-check-circle" style="color: #4CAF50;"></i>
            <span>Grammar Check Complete</span>
          </div>
          <div class="ai-result-content">
            <p style="color: #4CAF50;">✓ No grammar issues found!</p>
          </div>
        </div>
      `;
    } else {
      const suggestionsList = result.suggestions.map(s => 
        `<li>${s.rule} (${s.count} issue${s.count > 1 ? 's' : ''})</li>`
      ).join('');
      
      output.innerHTML = `
        <div class="ai-result">
          <div class="ai-result-header">
            <i class="fas fa-spell-check"></i>
            <span>Grammar Suggestions (${result.issuesFound} issues found)</span>
          </div>
          <div class="ai-result-content">
            <div class="grammar-sections">
              <div class="original-section">
                <label>Original Text:</label>
                <div class="text-preview">${result.originalText}</div>
              </div>
              <div class="corrected-section">
                <label>Suggested Corrections:</label>
                <div class="text-preview">${result.correctedText}</div>
              </div>
              <div class="issues-section">
                <label>Issues Found:</label>
                <ul class="issues-list">${suggestionsList}</ul>
              </div>
            </div>
          </div>
          <div class="ai-result-actions">
            <button onclick="copyToClipboard('${result.correctedText.replace(/'/g, "\\'")}')">
              <i class="fas fa-copy"></i> Copy Corrected Text
            </button>
          </div>
        </div>
      `;
    }
  }

  // Keyword Extractor using TF-IDF algorithm
  async extractKeywords() {
    const text = document.getElementById('text-for-keywords').value.trim();
    const count = parseInt(document.getElementById('keyword-count').value);
    
    if (!text) {
      this.showError('keywords-output', 'Please enter text to extract keywords from');
      return;
    }

    this.showLoading('keywords-output', 'Extracting keywords...');

    try {
      const keywords = this.extractKeywordsUsingTFIDF(text, count);
      this.displayKeywords(keywords);
    } catch (error) {
      this.showError('keywords-output', 'Error extracting keywords: ' + error.message);
    }
  }

  extractKeywordsUsingTFIDF(text, count) {
    // Common stop words to filter out
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
      'above', 'below', 'between', 'among', 'throughout', 'despite', 'towards', 'upon',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
      'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their'
    ]);

    // Tokenize and clean words
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    // Calculate word frequencies
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Calculate TF-IDF scores (simplified)
    const totalWords = words.length;
    const keywords = Object.entries(wordFreq)
      .map(([word, freq]) => {
        const tf = freq / totalWords;
        const idf = Math.log(totalWords / freq); // Simplified IDF
        return {
          word,
          frequency: freq,
          score: tf * idf
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, count);

    return keywords;
  }

  displayKeywords(keywords) {
    const output = document.getElementById('keywords-output');
    
    const keywordsList = keywords.map((kw, index) => 
      `<div class="keyword-item">
        <span class="keyword-rank">${index + 1}</span>
        <span class="keyword-word">${kw.word}</span>
        <span class="keyword-freq">×${kw.frequency}</span>
      </div>`
    ).join('');
    
    output.innerHTML = `
      <div class="ai-result">
        <div class="ai-result-header">
          <i class="fas fa-tags"></i>
          <span>Extracted Keywords</span>
        </div>
        <div class="ai-result-content">
          <div class="keywords-grid">
            ${keywordsList}
          </div>
        </div>
        <div class="ai-result-actions">
          <button onclick="copyToClipboard('${keywords.map(k => k.word).join(', ')}')">
            <i class="fas fa-copy"></i> Copy Keywords
          </button>
        </div>
      </div>
    `;
  }

  // Utility methods
  showLoading(outputId, message) {
    const output = document.getElementById(outputId);
    output.innerHTML = `
      <div class="ai-loading">
        <div class="loading-spinner"></div>
        <p>${message}</p>
      </div>
    `;
  }

  showError(outputId, message) {
    const output = document.getElementById(outputId);
    output.innerHTML = `
      <div class="ai-error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>${message}</p>
      </div>
    `;
  }
}

// Initialize AI Tools
const aiTools = new AITools();

// AI Tool Functions
function summarizeText() {
  aiTools.summarizeText();
}

function clearSummarizer() {
  document.getElementById('text-to-summarize').value = '';
  document.getElementById('summarizer-output').innerHTML = `
    <div style="color: #888; text-align: center; margin-top: 100px;">
      <i class="fas fa-compress-alt" style="font-size: 48px; margin-bottom: 10px;"></i>
      <div>Summary will appear here</div>
    </div>
  `;
}

function translateText() {
  aiTools.translateText();
}

function clearTranslator() {
  document.getElementById('text-to-translate').value = '';
  document.getElementById('translator-output').innerHTML = `
    <div style="color: #888; text-align: center; margin-top: 100px;">
      <i class="fas fa-language" style="font-size: 48px; margin-bottom: 10px;"></i>
      <div>Translation will appear here</div>
    </div>
  `;
}

function analyzeSentiment() {
  aiTools.analyzeSentiment();
}

function clearSentiment() {
  document.getElementById('text-to-analyze').value = '';
  document.getElementById('sentiment-output').innerHTML = `
    <div style="color: #888; text-align: center; margin-top: 100px;">
      <i class="fas fa-smile" style="font-size: 48px; margin-bottom: 10px;"></i>
      <div>Sentiment analysis will appear here</div>
    </div>
  `;
}

function checkGrammar() {
  aiTools.checkGrammar();
}

function clearGrammar() {
  document.getElementById('text-to-check').value = '';
  document.getElementById('grammar-output').innerHTML = `
    <div style="color: #888; text-align: center; margin-top: 100px;">
      <i class="fas fa-spell-check" style="font-size: 48px; margin-bottom: 10px;"></i>
      <div>Grammar suggestions will appear here</div>
    </div>
  `;
}

function extractKeywords() {
  aiTools.extractKeywords();
}

function clearKeywords() {
  document.getElementById('text-for-keywords').value = '';
  document.getElementById('keywords-output').innerHTML = `
    <div style="color: #888; text-align: center; margin-top: 100px;">
      <i class="fas fa-tags" style="font-size: 48px; margin-bottom: 10px;"></i>
      <div>Extracted keywords will appear here</div>
    </div>
  `;
}

// Utility function for copying text
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Show temporary success message
    const notification = document.createElement('div');
    notification.textContent = 'Copied to clipboard!';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 14px;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  }).catch(err => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    // Show success message
    const notification = document.createElement('div');
    notification.textContent = 'Copied to clipboard!';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 14px;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  });
}

// Copy text from a specific element (input/textarea)
function copyFromElement(elementId) {
  const element = document.getElementById(elementId);
  if (element && element.value.trim()) {
    copyToClipboard(element.value);
  } else {
    showNotification('No text to copy', 'warning');
  }
}

// Copy text from output sections
function copyOutputText(outputElementId) {
  const outputElement = document.getElementById(outputElementId);
  if (!outputElement) return;
  
  // Get the text content, excluding the placeholder content
  const placeholderElement = outputElement.querySelector('div[style*="text-align: center"]');
  if (placeholderElement && placeholderElement.style.color === 'rgb(136, 136, 136)') {
    showNotification('No results to copy', 'warning');
    return;
  }
  
  // Extract text content from the output
  let textToCopy = '';
  
  // Handle different types of output formats
  if (outputElement.querySelector('.ai-result')) {
    // AI result format
    const aiResult = outputElement.querySelector('.ai-result');
    const content = aiResult.querySelector('.ai-result-content');
    if (content) {
      textToCopy = content.innerText || content.textContent;
    }
  } else if (outputElement.querySelector('.translation-pair')) {
    // Translation format
    const translatedText = outputElement.querySelector('.translated-text p');
    if (translatedText) {
      textToCopy = translatedText.innerText || translatedText.textContent;
    }
  } else if (outputElement.querySelector('.sentiment-result')) {
    // Sentiment analysis format
    const sentimentResult = outputElement.querySelector('.sentiment-result');
    textToCopy = sentimentResult.innerText || sentimentResult.textContent;
  } else if (outputElement.querySelector('.grammar-sections')) {
    // Grammar checker format
    const correctedSection = outputElement.querySelector('.corrected-section .text-preview');
    if (correctedSection) {
      textToCopy = correctedSection.innerText || correctedSection.textContent;
    }
  } else if (outputElement.querySelector('.keywords-grid')) {
    // Keywords format
    const keywords = Array.from(outputElement.querySelectorAll('.keyword-text'))
      .map(el => el.textContent.trim())
      .join(', ');
    textToCopy = keywords;
  } else {
    // Fallback - get all text content
    textToCopy = outputElement.innerText || outputElement.textContent;
  }
  
  if (textToCopy.trim()) {
    copyToClipboard(textToCopy.trim());
  } else {
    showNotification('No results to copy', 'warning');
  }
}

// Paste text from clipboard to a specific element
async function pasteToElement(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        element.value = text;
        element.focus();
        showNotification('Text pasted successfully', 'success');
      } else {
        showNotification('Clipboard is empty', 'warning');
      }
    } else {
      // Fallback for browsers without clipboard API
      element.focus();
      showNotification('Please use Ctrl+V to paste', 'info');
    }
  } catch (err) {
    // Handle permission denied or other errors
    element.focus();
    showNotification('Please use Ctrl+V to paste', 'info');
  }
}

// Show notification helper function
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.textContent = message;
  
  let backgroundColor;
  switch (type) {
    case 'success':
      backgroundColor = '#4CAF50';
      break;
    case 'warning':
      backgroundColor = '#FF9800';
      break;
    case 'error':
      backgroundColor = '#F44336';
      break;
    default:
      backgroundColor = '#2196F3';
  }
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${backgroundColor};
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 10000;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add animation keyframes if not already added
  if (!document.querySelector('#notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(notification);
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }
  }, 3000);
}
