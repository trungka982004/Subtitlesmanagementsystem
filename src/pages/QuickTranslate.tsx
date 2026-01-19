import { useState } from 'react';
import { Languages, Copy, Check, Trash2, Settings, Globe, Clock, Type } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { useTranslation } from '../hooks/useTranslation';
import { translateText } from '../services/libreTranslate';
import { translateWithCustomModel } from '../services/customNLP';

export function QuickTranslate() {
  const { t } = useTranslation();
  const [sourceText, setSourceText] = useState('');
  const [contentType, setContentType] = useState('');
  const [relationship, setRelationship] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [googleResult, setGoogleResult] = useState('');
  const [nlpResult, setNlpResult] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedGoogle, setCopiedGoogle] = useState(false);
  const [copiedNlp, setCopiedNlp] = useState(false);

  // New features migrated from Settings
  const [translationStyle, setTranslationStyle] = useState('');
  const [maxCharsPerLine, setMaxCharsPerLine] = useState(40);
  const [maxLines, setMaxLines] = useState<1 | 2>(2);
  const [smartLineBreak, setSmartLineBreak] = useState(true);

  const [selectedModel, setSelectedModel] = useState<string>('mbart');

  const genres = [
    { value: 'ancient', label: t('genreAncient'), icon: '🧛🏻' },
    { value: 'martial', label: t('genreMartial'), icon: '⚔️' },
    { value: 'fantasy', label: t('genreFantasy'), icon: '🧚🏻' },
    { value: 'historical_drama', label: t('genreHistoricalDrama'), icon: '📜' },
  ];

  const contentTypes = [
    { value: 'drama', label: t('contentTypeDrama') },
    { value: 'movie', label: t('contentTypeMovie') },
    { value: 'documentary', label: t('contentTypeDocumentary') },
    { value: 'comedy', label: t('contentTypeComedy') },
    { value: 'action', label: t('contentTypeAction') },
    { value: 'romance', label: t('contentTypeRomance') },
    { value: 'historical', label: t('contentTypeHistorical') },
    { value: 'fantasy', label: t('contentTypeFantasy') },
    { value: 'modern', label: t('contentTypeModern') },
  ];

  const relationships = [
    { value: 'formal', label: t('relationshipFormal') },
    { value: 'informal', label: t('relationshipInformal') },
    { value: 'family', label: t('relationshipFamily') },
    { value: 'romantic', label: t('relationshipRomantic') },
    { value: 'professional', label: t('relationshipProfessional') },
    { value: 'master-servant', label: t('relationshipMasterServant') },
    { value: 'enemies', label: t('relationshipEnemies') },
    { value: 'strangers', label: t('relationshipStrangers') },
  ];

  const handleTranslate = async () => {
    if (!sourceText.trim() || !contentType || !relationship || !translationStyle) return;

    setIsTranslating(true);
    setGoogleResult(''); // Clear previous results
    setNlpResult('');

    try {
      // 1. Call LibreTranslate API (Parallel)
      const googlePromise = translateText(sourceText, 'vi', 'auto')
        .then(res => setGoogleResult(res))
        .catch(err => {
          console.error("LibreTranslate failed", err);
          setGoogleResult("Translation failed. Please check if LibreTranslate is running.");
        });

      // 2. Call Custom NLP Model (Parallel)
      const nlpPromise = translateWithCustomModel(sourceText, selectedModel)
        .then(res => setNlpResult(res))
        .catch(err => {
          console.error("Custom NLP failed", err);
          setNlpResult("Translation failed. Please check Custom NLP Service status in Settings.");
        });

      await Promise.all([googlePromise, nlpPromise]);

    } catch (error) {
      console.error("Translation process error", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = (text: string, type: 'google' | 'nlp') => {
    navigator.clipboard.writeText(text);
    if (type === 'google') {
      setCopiedGoogle(true);
      setTimeout(() => setCopiedGoogle(false), 2000);
    } else {
      setCopiedNlp(true);
      setTimeout(() => setCopiedNlp(false), 2000);
    }
  };

  const handleClear = () => {
    setSourceText('');
    setContentType('');
    setRelationship('');
    setAdditionalContext('');
    setTranslationStyle('');
    setMaxCharsPerLine(40);
    setMaxLines(2);
    setSmartLineBreak(true);
    setGoogleResult('');
    setNlpResult('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm mb-8 relative overflow-hidden group transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/10 transition-colors" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full -ml-12 -mb-12 blur-2xl group-hover:bg-purple-500/10 transition-colors" />

        <div className="relative flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
              <Languages className="w-6 h-6" />
            </span>
            <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-300 dark:to-white bg-clip-text text-transparent">
              {t('quickTranslateTitle')}
            </h2>
          </div>
          <p className="text-slate-500 mt-2 text-lg font-medium max-w-2xl leading-relaxed pl-1 border-l-4 border-blue-500/20 ml-2">
            {t('quickTranslateDesc')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-lg rounded-xl transition-all duration-300">
            <div className="space-y-4">
              {/* Source Text */}
              <div>
                <Label htmlFor="sourceText" className="text-slate-700 dark:text-slate-200 font-bold">
                  {t('sourceText')}
                </Label>
                <Textarea
                  id="sourceText"
                  placeholder={t('sourceTextPlaceholder')}
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  className="mt-2 min-h-32 bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-black dark:text-slate-100 focus:border-blue-500 focus:ring-blue-500 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>

              {/* Content Type */}
              <div>
                <Label htmlFor="contentType" className="text-slate-700 dark:text-slate-200 font-bold">
                  {t('contentType')} <span className="text-blue-500">*</span>
                </Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger
                    id="contentType"
                    className="mt-2 bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-black dark:text-slate-100 rounded-lg"
                  >
                    <SelectValue placeholder={t('selectContentType')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-black dark:text-slate-100 z-[100] shadow-2xl">
                    {contentTypes.map((type) => (
                      <SelectItem
                        key={type.value}
                        value={type.value}
                        className="text-black dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-black dark:focus:text-white cursor-pointer"
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Translation Style (New from Settings) */}
              <div>
                <Label htmlFor="translationStyle" className="text-slate-700 dark:text-slate-200 font-bold">
                  {t('genreStyle')} <span className="text-blue-500">*</span>
                </Label>
                <Select value={translationStyle} onValueChange={setTranslationStyle}>
                  <SelectTrigger
                    id="translationStyle"
                    className="mt-2 bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-black dark:text-slate-100 rounded-lg"
                  >
                    <SelectValue placeholder={t('selectTranslationStyle')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-black dark:text-slate-100 z-[100] shadow-2xl">
                    {genres.map((g) => (
                      <SelectItem
                        key={g.value}
                        value={g.value}
                        className="text-black dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-black dark:focus:text-white cursor-pointer"
                      >
                        <span className="mr-2">{g.icon}</span> {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Character Relationship */}
              <div>
                <Label htmlFor="relationship" className="text-slate-700 dark:text-slate-200 font-bold">
                  {t('characterRelationship')} <span className="text-blue-500">*</span>
                </Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger
                    id="relationship"
                    className="mt-2 bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-black dark:text-slate-100 rounded-lg"
                  >
                    <SelectValue placeholder={t('selectRelationship')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-black dark:text-slate-100 z-[100] shadow-2xl">
                    {relationships.map((rel) => (
                      <SelectItem
                        key={rel.value}
                        value={rel.value}
                        className="text-black dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-black dark:focus:text-white cursor-pointer"
                      >
                        {rel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Context */}
              <div>
                <Label htmlFor="additionalContext" className="text-slate-700 dark:text-slate-200 font-bold">
                  {t('additionalContext')} <span className="text-slate-400">({t('optional')})</span>
                </Label>
                <Textarea
                  id="additionalContext"
                  placeholder={t('additionalContextPlaceholder')}
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  className="mt-2 min-h-24 bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-black dark:text-slate-100 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleTranslate}
                  disabled={!sourceText.trim() || !contentType || !relationship || !translationStyle || isTranslating}
                  className="flex-3 h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all text-white rounded-xl shadow-lg shadow-blue-200 font-bold border-none"
                >
                  <Languages className="w-5 h-5 mr-2" />
                  {isTranslating ? t('translating') : t('translateButton')}
                </Button>
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="flex-1 h-12 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all rounded-xl font-bold bg-white dark:bg-slate-950"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  {t('clearAll')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Subtitle Configuration Card (New from Settings) */}
          <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-lg rounded-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100">{t('subtitleConfiguration')}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-200 font-bold flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  {t('maxCharsPerLine')}
                </Label>
                <input
                  type="number"
                  value={maxCharsPerLine}
                  onChange={(e) => setMaxCharsPerLine(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-md text-black dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-200 font-bold">{t('maxLines')}</Label>
                <Select value={maxLines.toString()} onValueChange={(v: string) => setMaxLines(Number(v) as 1 | 2)}>
                  <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-black dark:text-slate-100 rounded-lg font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-black dark:text-slate-100 z-[100] shadow-2xl">
                    <SelectItem value="1" className="text-black dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-black dark:focus:text-white cursor-pointer">{t('oneLine')}</SelectItem>
                    <SelectItem value="2" className="text-black dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-black dark:focus:text-white cursor-pointer">{t('twoLines')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="smartBreak"
                  checked={smartLineBreak}
                  onChange={(e) => setSmartLineBreak(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950/50 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="smartBreak" className="text-slate-700 dark:text-slate-200 font-bold cursor-pointer">
                  {t('smartLineBreak')}
                </Label>
              </div>
            </div>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-slate-200 mb-4 font-semibold">
              {t('translationResults')}
            </h3>

            {/* LibreTranslate Result (Light Green Theme) */}
            <Card className="p-6 bg-[#f0fdf4] dark:bg-slate-900 border-green-200 dark:border-green-900/30 mb-4 shadow-xl rounded-xl transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-green-500 rounded-lg text-white">
                    <Globe className="w-5 h-5" />
                  </span>
                  <h4 className="text-green-900 font-bold text-lg">
                    {t('googleTranslate')}
                  </h4>
                </div>
                {googleResult && (
                  <Button
                    onClick={() => handleCopy(googleResult, 'google')}
                    variant="ghost"
                    size="sm"
                    className="text-green-600 dark:text-green-400 hover:text-green-700 hover:bg-green-100/50 dark:hover:bg-green-900/30 active:scale-90 transition-all rounded-lg border border-green-200 dark:border-green-800 bg-white/50 dark:bg-black/20"
                  >
                    {copiedGoogle ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        {t('copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        {t('copyToClipboard')}
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="min-h-32 p-5 bg-gradient-to-br from-white to-green-50/50 dark:from-slate-950/50 dark:to-green-900/10 rounded-lg border border-green-200 dark:border-green-900/30 shadow-sm flex flex-col">
                {googleResult ? (
                  <p className="text-green-950 dark:text-green-100 font-medium whitespace-pre-wrap leading-relaxed text-base">
                    {googleResult}
                  </p>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 text-green-600/40 dark:text-green-400/30 italic gap-3 border-2 border-dashed border-green-100 dark:border-green-900/30 rounded-lg bg-green-50/20 dark:bg-green-900/10">
                    <Globe className="w-10 h-10 opacity-20 animate-pulse" />
                    <p className="text-green-800/40 font-semibold tracking-wide">{t('machineTranslationPlaceholder')}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Custom NLP Model Result (Light Purple Theme) */}
            <Card className="p-6 bg-[#faf5ff] dark:bg-slate-900 border-purple-200 dark:border-purple-900/30 shadow-xl rounded-xl transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-purple-500 rounded-lg text-white">
                    <Settings className="w-5 h-5" />
                  </span>
                  <div className="flex flex-col">
                    <h4 className="text-purple-900 font-bold text-lg leading-tight">
                      {t('customNLPModel')}
                    </h4>

                    {/* Model Selector within the card header */}
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="h-6 mt-1 w-[140px] bg-white/50 border-purple-200 text-xs font-bold text-purple-700 rounded-md focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mbart">mBART-50</SelectItem>
                        <SelectItem value="opus">Opus MT</SelectItem>
                        <SelectItem value="nllb">NLLB-200</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {nlpResult && (
                  <Button
                    onClick={() => handleCopy(nlpResult, 'nlp')}
                    variant="ghost"
                    size="sm"
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 active:scale-90 transition-all rounded-lg border border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-black/20"
                  >
                    {copiedNlp ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        {t('copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        {t('copyToClipboard')}
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="min-h-32 p-5 bg-gradient-to-br from-white to-purple-50/50 dark:from-slate-950/50 dark:to-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-900/30 shadow-sm flex flex-col">
                {nlpResult ? (
                  <p className="text-purple-950 dark:text-purple-100 font-medium whitespace-pre-wrap leading-relaxed text-base">
                    {nlpResult}
                  </p>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 text-purple-600/40 dark:text-purple-400/30 italic gap-3 border-2 border-dashed border-purple-100 dark:border-purple-900/30 rounded-lg bg-purple-50/20 dark:bg-purple-900/10">
                    <Settings className="w-10 h-10 opacity-20 animate-pulse" />
                    <p className="text-purple-800/40 font-semibold tracking-wide">{t('nlpTranslationPlaceholder')}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Info Box */}
      {(contentType || relationship) && (
        <Card className="p-4 bg-blue-900/20 border-blue-500/20 rounded-xl">
          <div className="flex gap-2">
            <div className="text-blue-400">ℹ️</div>
            <div>
              <p className="text-slate-200">
                <span className="font-medium">{t('contextSelected')}</span>
              </p>
              <p className="text-slate-400 mt-1">
                {contentType && (
                  <span className="inline-block bg-[#0f172a] border border-blue-500/30 px-3 py-1 rounded-full mr-2 mb-2 text-sm shadow-sm text-blue-200">
                    {contentTypes.find(ct => ct.value === contentType)?.label}
                  </span>
                )}
                {relationship && (
                  <span className="inline-block bg-[#0f172a] border border-blue-500/30 px-3 py-1 rounded-full mr-2 mb-2 text-sm shadow-sm text-blue-200">
                    {relationships.find(r => r.value === relationship)?.label}
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}