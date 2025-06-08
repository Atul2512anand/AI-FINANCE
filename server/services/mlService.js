const tf = require('@tensorflow/tfjs-node');
const natural = require('natural');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const path = require('path');
const fs = require('fs');

// Initialize tokenizer and stemmer
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Model state
let model = null;
let wordVectors = {};
let categoryMap = {};
let isModelLoaded = false;

/**
 * Load or create the ML model
 */
async function loadModel(userId) {
  try {
    // Check if model exists for this user
    const modelPath = process.env.ML_MODEL_PATH 
      ? path.join(process.env.ML_MODEL_PATH, `user_${userId}`) 
      : path.join(__dirname, '..', 'ml', 'models', `user_${userId}`);
    
    // Try to load existing model
    if (fs.existsSync(`${modelPath}/model.json`)) {
      model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
      
      // Load word vectors and category map
      wordVectors = JSON.parse(fs.readFileSync(`${modelPath}/word_vectors.json`, 'utf8'));
      categoryMap = JSON.parse(fs.readFileSync(`${modelPath}/category_map.json`, 'utf8'));
      
      isModelLoaded = true;
      console.log(`Loaded existing model for user ${userId}`);
      return true;
    }
    
    // If no model exists, we'll need to train one when we have enough data
    console.log(`No existing model found for user ${userId}`);
    return false;
  } catch (err) {
    console.error('Error loading model:', err);
    return false;
  }
}

/**
 * Preprocess text for ML
 */
function preprocessText(text) {
  // Convert to lowercase
  const lowerText = text.toLowerCase();
  
  // Tokenize
  const tokens = tokenizer.tokenize(lowerText);
  
  // Stem words
  const stemmed = tokens.map(token => stemmer.stem(token));
  
  return stemmed;
}

/**
 * Convert text to vector using word embeddings
 */
function textToVector(text, amount) {
  const tokens = preprocessText(text);
  const vector = new Array(Object.keys(wordVectors).length + 1).fill(0);
  
  // Add word vectors
  for (const token of tokens) {
    if (wordVectors[token]) {
      const idx = wordVectors[token];
      vector[idx] = 1;
    }
  }
  
  // Add amount as a feature (normalized)
  vector[vector.length - 1] = Math.min(amount / 1000, 1); // Normalize amount
  
  return vector;
}

/**
 * Predict category for an expense
 */
async function predictCategory(description, amount, userId) {
  try {
    // If model isn't loaded, try to load it
    if (!isModelLoaded) {
      const loaded = await loadModel(userId);
      if (!loaded) {
        // If we can't load a model, try to find the most similar expense
        return findSimilarExpense(description, amount, userId);
      }
    }
    
    // Convert input to vector
    const inputVector = textToVector(description, amount);
    
    // Make prediction
    const inputTensor = tf.tensor2d([inputVector]);
    const prediction = model.predict(inputTensor);
    const probabilities = await prediction.data();
    
    // Get highest probability category
    let maxProb = 0;
    let predictedCategoryId = null;
    
    Object.keys(categoryMap).forEach(categoryId => {
      const idx = categoryMap[categoryId];
      if (probabilities[idx] > maxProb) {
        maxProb = probabilities[idx];
        predictedCategoryId = categoryId;
      }
    });
    
    // Cleanup tensors
    inputTensor.dispose();
    prediction.dispose();
    
    return {
      categoryId: predictedCategoryId,
      confidence: maxProb
    };
  } catch (err) {
    console.error('Error predicting category:', err);
    return { categoryId: null, confidence: 0 };
  }
}

/**
 * Find similar expense when no model is available
 */
async function findSimilarExpense(description, amount, userId) {
  try {
    // Get user's expenses
    const expenses = await Expense.find({ user: userId })
      .sort({ date: -1 })
      .limit(100);
    
    if (expenses.length === 0) {
      return { categoryId: null, confidence: 0 };
    }
    
    // Simple text similarity using Jaccard index
    const descTokens = new Set(preprocessText(description));
    let bestMatch = { expense: null, similarity: 0 };
    
    for (const expense of expenses) {
      const expTokens = new Set(preprocessText(expense.description));
      
      // Calculate intersection and union
      const intersection = new Set([...descTokens].filter(x => expTokens.has(x)));
      const union = new Set([...descTokens, ...expTokens]);
      
      // Jaccard similarity
      const similarity = intersection.size / union.size;
      
      // Add bonus for similar amounts
      const amountSimilarity = 1 - Math.min(Math.abs(expense.amount - amount) / Math.max(expense.amount, amount), 1);
      const totalSimilarity = similarity * 0.7 + amountSimilarity * 0.3;
      
      if (totalSimilarity > bestMatch.similarity) {
        bestMatch = { expense, similarity: totalSimilarity };
      }
    }
    
    // Return best match if similarity is above threshold
    if (bestMatch.similarity > 0.3) {
      return {
        categoryId: bestMatch.expense.category.toString(),
        confidence: bestMatch.similarity
      };
    }
    
    return { categoryId: null, confidence: 0 };
  } catch (err) {
    console.error('Error finding similar expense:', err);
    return { categoryId: null, confidence: 0 };
  }
}

/**
 * Train model with user's expense data
 */
async function trainModel(userId) {
  try {
    console.log(`Training model for user ${userId}...`);
    
    // Get user's expenses with categories
    const expenses = await Expense.find({ user: userId })
      .populate('category')
      .sort({ date: -1 });
    
    if (expenses.length < 20) {
      console.log('Not enough data to train model');
      return false;
    }
    
    // Build vocabulary and category map
    const vocabulary = new Set();
    const categories = new Set();
    
    expenses.forEach(expense => {
      if (expense.category) {
        const tokens = preprocessText(expense.description);
        tokens.forEach(token => vocabulary.add(token));
        categories.add(expense.category._id.toString());
      }
    });
    
    // Create word vectors
    wordVectors = {};
    Array.from(vocabulary).forEach((word, idx) => {
      wordVectors[word] = idx;
    });
    
    // Create category map
    categoryMap = {};
    Array.from(categories).forEach((categoryId, idx) => {
      categoryMap[categoryId] = idx;
    });
    
    // Prepare training data
    const trainingData = [];
    const trainingLabels = [];
    
    expenses.forEach(expense => {
      if (expense.category) {
        const vector = textToVector(expense.description, expense.amount);
        const categoryIdx = categoryMap[expense.category._id.toString()];
        
        trainingData.push(vector);
        
        // One-hot encode the category
        const label = new Array(categories.size).fill(0);
        label[categoryIdx] = 1;
        trainingLabels.push(label);
      }
    });
    
    // Create and train model
    model = tf.sequential();
    
    // Input layer
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [vocabulary.size + 1] // +1 for amount
    }));
    
    // Hidden layer
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu'
    }));
    
    // Output layer
    model.add(tf.layers.dense({
      units: categories.size,
      activation: 'softmax'
    }));
    
    // Compile model
    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    // Convert training data to tensors
    const xs = tf.tensor2d(trainingData);
    const ys = tf.tensor2d(trainingLabels);
    
    // Train model
    await model.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs.loss}, accuracy = ${logs.acc}`);
        }
      }
    });
    
    // Cleanup tensors
    xs.dispose();
    ys.dispose();
    
    // Save model
    const modelPath = process.env.ML_MODEL_PATH 
      ? path.join(process.env.ML_MODEL_PATH, `user_${userId}`) 
      : path.join(__dirname, '..', 'ml', 'models', `user_${userId}`);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(modelPath)) {
      fs.mkdirSync(modelPath, { recursive: true });
    }
    
    await model.save(`file://${modelPath}`);
    
    // Save word vectors and category map
    fs.writeFileSync(`${modelPath}/word_vectors.json`, JSON.stringify(wordVectors));
    fs.writeFileSync(`${modelPath}/category_map.json`, JSON.stringify(categoryMap));
    
    isModelLoaded = true;
    console.log(`Model trained and saved for user ${userId}`);
    
    return true;
  } catch (err) {
    console.error('Error training model:', err);
    return false;
  }
}

/**
 * Schedule model training
 */
async function scheduleTraining(userId) {
  // Check if we have enough new data to retrain
  const expenseCount = await Expense.countDocuments({ user: userId });
  
  if (expenseCount >= 20 && (!isModelLoaded || expenseCount % 20 === 0)) {
    // Train in the background
    setTimeout(() => {
      trainModel(userId).catch(err => console.error('Training error:', err));
    }, 0);
  }
}

module.exports = {
  predictCategory,
  trainModel,
  scheduleTraining
};