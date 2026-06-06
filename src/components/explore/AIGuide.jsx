import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Volume2, VolumeX, Sparkles, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AIGuide({ location }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const askGuide = async (customQuery) => {
    const q = customQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    setResponse('');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are YatraMitra, an expert AI tour guide for India. The user is currently at latitude ${location?.lat}, longitude ${location?.lng}.

User's question: "${q}"

Provide a helpful, engaging response about this location or topic. Include:
- Historical and cultural insights
- Practical travel tips
- Hidden gems and local recommendations
- Safety tips if relevant
Be conversational and enthusiastic about Indian travel. Use emojis sparingly for visual appeal.`,
      add_context_from_internet: true,
    });

    setResponse(result);
    setLoading(false);
    setQuery('');
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (response) {
      const utterance = new SpeechSynthesisUtterance(response.replace(/[#*_`]/g, ''));
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      askGuide(transcript);
    };
    recognition.start();
  };

  const quickQuestions = [
    "What is this place famous for?",
    "Best street food nearby?",
    "Hidden gems around here?",
    "Is this area safe at night?",
    "Cultural tips for visitors?",
  ];

  return (
    <div className="space-y-4 mt-4">
      {/* Quick Questions */}
      <div className="flex flex-wrap gap-2">
        {quickQuestions.map((q, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            onClick={() => { setQuery(q); askGuide(q); }}
            className="text-xs rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            {q}
          </Button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={startVoiceInput} className="rounded-xl shrink-0 border-orange-200 hover:bg-orange-50">
          <Mic className="w-4 h-4 text-orange-500" />
        </Button>
        <Input
          placeholder="Ask me anything about this place..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && askGuide()}
          className="rounded-xl"
        />
        <Button onClick={() => askGuide()} disabled={loading || !query.trim()} className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

      {/* Response */}
      {loading && (
        <Card className="p-6 rounded-2xl text-center border-slate-100">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Your AI guide is thinking...</p>
        </Card>
      )}

      {response && !loading && (
        <Card className="p-5 rounded-2xl border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-slate-700">YatraMitra Guide</span>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleSpeech} className="h-8 w-8">
              {isSpeaking ? <VolumeX className="w-4 h-4 text-orange-500" /> : <Volume2 className="w-4 h-4 text-slate-400" />}
            </Button>
          </div>
          <div className="prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
        </Card>
      )}

      {!response && !loading && (
        <Card className="p-8 rounded-2xl border-dashed border-2 border-amber-200 bg-amber-50/30 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">AI Tour Guide</h3>
          <p className="text-xs text-slate-500">Ask about history, food, culture, safety, or anything about your surroundings!</p>
        </Card>
      )}
    </div>
  );
}