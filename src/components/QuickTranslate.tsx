import { useState } from 'react';
import { Languages, Copy, Check, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
        <h2 className="text-gray-900 dark:text-slate-200 flex items-center gap-2">
          <Languages className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          {t('quickTranslateTitle')}
        </h2>
        <p className="text-gray-600 dark:text-slate-400 mt-1">
          {t('quickTranslateDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
            <div className="space-y-4">
              {/* Source Text */}
              <div>
                <Label htmlFor="sourceText" className="text-gray-900 dark:text-slate-200">
                  {t('sourceText')}
                </Label>
                <Textarea
                  id="sourceText"
                  placeholder={t('sourceTextPlaceholder')}
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  className="mt-2 min-h-32 bg-white dark:bg-slate-850 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200"
                />
              </div>

              {/* Content Type */}
              <div>
                <Label htmlFor="contentType" className="text-gray-900 dark:text-slate-200">
                  {t('contentType')} <span className="text-red-500">*</span>
                </Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger
                    id="contentType"
                    className="mt-2 bg-white dark:bg-slate-850 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200"
                  >
                    <SelectValue placeholder={t('selectContentType')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                    {contentTypes.map((type) => (
                      <SelectItem
                        key={type.value}
                        value={type.value}
                        className="text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Character Relationship */}
              <div>
                <Label htmlFor="relationship" className="text-gray-900 dark:text-slate-200">
                  {t('characterRelationship')} <span className="text-red-500">*</span>
                </Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger
                    id="relationship"
                    className="mt-2 bg-white dark:bg-slate-850 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200"
                  >
                    <SelectValue placeholder={t('selectRelationship')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                    {relationships.map((rel) => (
                      <SelectItem
                        key={rel.value}
                        value={rel.value}
                        className="text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        {rel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Context */}
              <div>
                <Label htmlFor="additionalContext" className="text-gray-900 dark:text-slate-200">
                  {t('additionalContext')} <span className="text-gray-400 dark:text-slate-500">({t('optional')})</span>
                </Label>
                <Textarea
                  id="additionalContext"
                  placeholder={t('additionalContextPlaceholder')}
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  className="mt-2 min-h-24 bg-white dark:bg-slate-850 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleTranslate}
                  disabled={!sourceText.trim() || !contentType || !relationship || isTranslating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Languages className="w-4 h-4 mr-2" />
                  {isTranslating ? t('translating') : t('translateButton')}
                </Button>
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('clearAll')}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-gray-900 dark:text-slate-200 mb-4">
              {t('translationResults')}
            </h3>

            {/* Google Translate Result */}
            <Card className="p-6 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-gray-900 dark:text-slate-200">
                  {t('googleTranslate')}
                </h4>
                {googleResult && (
                  <Button
                    onClick={() => handleCopy(googleResult, 'google')}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
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
              <div className="min-h-32 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                {googleResult ? (
                  <p className="text-gray-900 dark:text-slate-200 whitespace-pre-wrap">
                    {googleResult}
                  </p>
                ) : (
                  <p className="text-gray-400 dark:text-slate-500 italic">
                    Translation result will appear here...
                  </p>
                )}
              </div>
            </Card>

            {/* Custom NLP Model Result */}
            <Card className="p-6 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-gray-900 dark:text-slate-200">
                  {t('customNLPModel')}
                </h4>
                {nlpResult && (
                  <Button
                    onClick={() => handleCopy(nlpResult, 'nlp')}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
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
              <div className="min-h-32 p-4 bg-blue-50 dark:bg-blue-900-20 rounded-lg border border-blue-200 dark:border-blue-900/30">
                {nlpResult ? (
                  <p className="text-gray-900 dark:text-slate-200 whitespace-pre-wrap">
                    {nlpResult}
                  </p>
                ) : (
                  <p className="text-gray-400 dark:text-slate-500 italic">
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
        <Card className="p-4 bg-blue-50 dark:bg-blue-900-20 border-blue-200 dark:border-blue-900/30">
          <div className="flex gap-2">
            <div className="text-blue-600 dark:text-blue-400">ℹ️</div>
            <div>
              <p className="text-gray-900 dark:text-slate-200">
                <span className="font-medium">Context Selected:</span>
              </p>
              <p className="text-gray-700 dark:text-slate-300 mt-1">
                {contentType && (
                  <span className="inline-block bg-white dark:bg-slate-800 px-3 py-1 rounded-full mr-2 mb-2">
                    {contentTypes.find(ct => ct.value === contentType)?.label}
                  </span>
                )}
                {relationship && (
                  <span className="inline-block bg-white dark:bg-slate-800 px-3 py-1 rounded-full mr-2 mb-2">
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