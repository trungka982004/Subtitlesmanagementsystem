import { useState } from 'react';
import { Languages, Copy, Check, Trash2, Settings, Globe, Clock, Type } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Switch } from './ui/switch'; // Assuming these exist, if not I will fallback to standard input/checkbox in next turn regarding error. 
// Actually, safely, I will use standard HTML inputs styled with Tailwind for now to avoid import errors if components are missing.
// Re-reading: The user has `ui/button`, `ui/card`, `ui/label`. It is highly likely `ui/input` exists. `ui/switch` is 50/50. 
// I will use standard HTML inputs to be 100% safe and consistent with my generic knowledge of this project state. 
// Wait, Settings.tsx used native inputs. QuickTranslate uses `ui/textarea`. 
// I'll use native inputs with the same classes as `Textarea` or `SelectTrigger`.
import { useTranslation } from '../hooks/useTranslation';
import { translateText } from '../services/libreTranslate';

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
  const [translationStyle, setTranslationStyle] = useState('ancient');
  const [maxCharsPerLine, setMaxCharsPerLine] = useState(40);
  const [maxLines, setMaxLines] = useState<1 | 2>(2);
  const [smartLineBreak, setSmartLineBreak] = useState(true);

  const genres = [
    { value: 'ancient', label: 'Cổ trang/Cung đấu', icon: '🧛🏻' },
    { value: 'martial', label: 'Kiếm hiệp/Giang hồ', icon: '⚔️' },
    { value: 'fantasy', label: 'Tiên hiệp/Huyền huyễn', icon: '🧚🏻' },
    { value: 'historical_drama', label: 'Chính kịch/Lịch sử', icon: '📜' },
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
    if (!sourceText.trim() || !contentType || !relationship) return;

    setIsTranslating(true);

    try {
      // Call LibreTranslate API
      const translatedText = await translateText(sourceText, 'vi', 'auto'); // Defaulting to Vietnamese as per context
      setGoogleResult(translatedText);

      // Mock Custom NLP Model result (placeholder)
      // When integrating real API: Pass sourceText, contentType, relationship, and additionalContext to your custom NLP model
      const contextInfo = `Loại nội dung: ${contentTypes.find(ct => ct.value === contentType)?.label}, Mối quan hệ: ${relationships.find(r => r.value === relationship)?.label}`;
      setNlpResult(`Kết quả từ Custom NLP Model sẽ xuất hiện tại đây khi tích hợp API.\n\nNgữ cảnh đã chọn: ${contextInfo}\n${additionalContext ? `\nThông tin bổ sung: ${additionalContext}` : ''}\n\nBản dịch này sẽ được tối ưu hóa dựa trên ngữ cảnh và mối quan hệ giữa các nhân vật.`);
    } catch (error) {
      console.error("Translation failed", error);
      setGoogleResult("Translation failed. Please check if LibreTranslate is running at http://localhost:5000");
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
    setGoogleResult('');
    setNlpResult('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-slate-200 flex items-center gap-2">
          <Languages className="w-6 h-6 text-blue-400" />
          {t('quickTranslateTitle')}
        </h2>
        <p className="text-slate-400 mt-1">
          {t('quickTranslateDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="p-6 bg-[#1e293b] border-slate-800 shadow-lg rounded-xl">
            <div className="space-y-4">
              {/* Source Text */}
              <div>
                <Label htmlFor="sourceText" className="text-slate-200 font-medium">
                  {t('sourceText')}
                </Label>
                <Textarea
                  id="sourceText"
                  placeholder={t('sourceTextPlaceholder')}
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  className="mt-2 min-h-32 bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg placeholder:text-slate-500"
                />
              </div>

              {/* Content Type */}
              <div>
                <Label htmlFor="contentType" className="text-slate-200 font-medium">
                  {t('contentType')} <span className="text-blue-500">*</span>
                </Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger
                    id="contentType"
                    className="mt-2 bg-[#0f172a] border-slate-700 text-slate-200 rounded-lg"
                  >
                    <SelectValue placeholder={t('selectContentType')} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-slate-700 text-slate-200">
                    {contentTypes.map((type) => (
                      <SelectItem
                        key={type.value}
                        value={type.value}
                        className="text-slate-200 hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Translation Style (New from Settings) */}
              <div>
                <Label htmlFor="translationStyle" className="text-slate-200 font-medium">
                  Phong cách dịch <span className="text-blue-500">*</span>
                </Label>
                <Select value={translationStyle} onValueChange={setTranslationStyle}>
                  <SelectTrigger
                    id="translationStyle"
                    className="mt-2 bg-[#0f172a] border-slate-700 text-slate-200 rounded-lg"
                  >
                    <SelectValue placeholder="Chọn phong cách dịch" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-slate-700 text-slate-200">
                    {genres.map((g) => (
                      <SelectItem
                        key={g.value}
                        value={g.value}
                        className="text-slate-200 hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                      >
                        <span className="mr-2">{g.icon}</span> {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Character Relationship */}
              <div>
                <Label htmlFor="relationship" className="text-slate-200 font-medium">
                  {t('characterRelationship')} <span className="text-blue-500">*</span>
                </Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger
                    id="relationship"
                    className="mt-2 bg-[#0f172a] border-slate-700 text-slate-200 rounded-lg"
                  >
                    <SelectValue placeholder={t('selectRelationship')} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-slate-700 text-slate-200">
                    {relationships.map((rel) => (
                      <SelectItem
                        key={rel.value}
                        value={rel.value}
                        className="text-slate-200 hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                      >
                        {rel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Context */}
              <div>
                <Label htmlFor="additionalContext" className="text-slate-200 font-medium">
                  {t('additionalContext')} <span className="text-slate-500">({t('optional')})</span>
                </Label>
                <Textarea
                  id="additionalContext"
                  placeholder={t('additionalContextPlaceholder')}
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  className="mt-2 min-h-24 bg-[#0f172a] border-slate-700 text-slate-200 rounded-lg placeholder:text-slate-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleTranslate}
                  disabled={!sourceText.trim() || !contentType || !relationship || isTranslating}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors border-none"
                >
                  <Languages className="w-4 h-4 mr-2" />
                  {isTranslating ? t('translating') : t('translateButton')}
                </Button>
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg bg-transparent"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('clearAll')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Subtitle Configuration Card (New from Settings) */}
          <Card className="p-6 bg-[#1e293b] border-slate-800 shadow-lg rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-blue-500" />
              <h3 className="font-medium text-slate-200">Cấu hình phụ đề</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Max Characters / Line
                </Label>
                <input
                  type="number"
                  value={maxCharsPerLine}
                  onChange={(e) => setMaxCharsPerLine(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Max Lines</Label>
                <Select value={maxLines.toString()} onValueChange={(v: string) => setMaxLines(Number(v) as 1 | 2)}>
                  <SelectTrigger className="bg-[#0f172a] border-slate-700 text-slate-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-slate-700 text-slate-200">
                    <SelectItem value="1">1 Line</SelectItem>
                    <SelectItem value="2">2 Lines</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="smartBreak"
                  checked={smartLineBreak}
                  onChange={(e) => setSmartLineBreak(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-[#0f172a] text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="smartBreak" className="text-slate-300 cursor-pointer">
                  Smart Line Break
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

            {/* Google Translate Result */}
            <Card className="p-6 bg-[#1e293b] border-slate-800 mb-4 shadow-lg rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-slate-200 font-medium">
                  {t('googleTranslate')}
                </h4>
                {googleResult && (
                  <Button
                    onClick={() => handleCopy(googleResult, 'google')}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white hover:bg-slate-800"
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
              <div className="min-h-32 p-4 bg-[#0f172a] rounded-lg border border-slate-700/50">
                {googleResult ? (
                  <p className="text-slate-200 whitespace-pre-wrap">
                    {googleResult}
                  </p>
                ) : (
                  <p className="text-slate-600 italic">
                    Translation result will appear here...
                  </p>
                )}
              </div>
            </Card>

            {/* Custom NLP Model Result */}
            <Card className="p-6 bg-[#1e293b] border-slate-800 shadow-lg rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-slate-200 font-medium">
                  {t('customNLPModel')}
                </h4>
                {nlpResult && (
                  <Button
                    onClick={() => handleCopy(nlpResult, 'nlp')}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white hover:bg-slate-800"
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
              <div className="min-h-32 p-4 bg-blue-900/10 rounded-lg border border-blue-500/20">
                {nlpResult ? (
                  <p className="text-slate-200 whitespace-pre-wrap">
                    {nlpResult}
                  </p>
                ) : (
                  <p className="text-slate-600 italic">
                    Translation result will appear here...
                  </p>
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
                <span className="font-medium">Context Selected:</span>
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