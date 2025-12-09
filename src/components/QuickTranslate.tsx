import { useState } from 'react';
import { Languages, Copy, Check, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useTranslation } from '../hooks/useTranslation';

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
    
    // Simulate API call - In production, this would call actual translation APIs
    // The context (contentType, relationship, additionalContext) would be passed to the API
    setTimeout(() => {
      // Mock Google Translate result (placeholder)
      // When integrating real API: Pass sourceText to Google Translate API
      setGoogleResult('Kết quả từ Google Translate sẽ xuất hiện tại đây khi tích hợp API. Đây là bản dịch tự động không tính đến ngữ cảnh chi tiết.');
      
      // Mock Custom NLP Model result (placeholder)
      // When integrating real API: Pass sourceText, contentType, relationship, and additionalContext to your custom NLP model
      const contextInfo = `Loại nội dung: ${contentTypes.find(ct => ct.value === contentType)?.label}, Mối quan hệ: ${relationships.find(r => r.value === relationship)?.label}`;
      setNlpResult(`Kết quả từ Custom NLP Model sẽ xuất hiện tại đây khi tích hợp API.\n\nNgữ cảnh đã chọn: ${contextInfo}\n${additionalContext ? `\nThông tin bổ sung: ${additionalContext}` : ''}\n\nBản dịch này sẽ được tối ưu hóa dựa trên ngữ cảnh và mối quan hệ giữa các nhân vật.`);
      
      setIsTranslating(false);
    }, 1500);
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
        <h2 className="text-gray-900 dark:text-white flex items-center gap-2">
          <Languages className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          {t('quickTranslateTitle')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('quickTranslateDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              {/* Source Text */}
              <div>
                <Label htmlFor="sourceText" className="text-gray-900 dark:text-white">
                  {t('sourceText')}
                </Label>
                <Textarea
                  id="sourceText"
                  placeholder={t('sourceTextPlaceholder')}
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  className="mt-2 min-h-32 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              {/* Content Type */}
              <div>
                <Label htmlFor="contentType" className="text-gray-900 dark:text-white">
                  {t('contentType')} <span className="text-red-500">*</span>
                </Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger 
                    id="contentType" 
                    className="mt-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  >
                    <SelectValue placeholder={t('selectContentType')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {contentTypes.map((type) => (
                      <SelectItem 
                        key={type.value} 
                        value={type.value}
                        className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Character Relationship */}
              <div>
                <Label htmlFor="relationship" className="text-gray-900 dark:text-white">
                  {t('characterRelationship')} <span className="text-red-500">*</span>
                </Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger 
                    id="relationship" 
                    className="mt-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  >
                    <SelectValue placeholder={t('selectRelationship')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {relationships.map((rel) => (
                      <SelectItem 
                        key={rel.value} 
                        value={rel.value}
                        className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {rel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Context */}
              <div>
                <Label htmlFor="additionalContext" className="text-gray-900 dark:text-white">
                  {t('additionalContext')} <span className="text-gray-400">({t('optional')})</span>
                </Label>
                <Textarea
                  id="additionalContext"
                  placeholder={t('additionalContextPlaceholder')}
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  className="mt-2 min-h-24 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
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
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
            <h3 className="text-gray-900 dark:text-white mb-4">
              {t('translationResults')}
            </h3>
            
            {/* Google Translate Result */}
            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-gray-900 dark:text-white">
                  {t('googleTranslate')}
                </h4>
                {googleResult && (
                  <Button
                    onClick={() => handleCopy(googleResult, 'google')}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
              <div className="min-h-32 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                {googleResult ? (
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {googleResult}
                  </p>
                ) : (
                  <p className="text-gray-400 dark:text-gray-500 italic">
                    Translation result will appear here...
                  </p>
                )}
              </div>
            </Card>

            {/* Custom NLP Model Result */}
            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-gray-900 dark:text-white">
                  {t('customNLPModel')}
                </h4>
                {nlpResult && (
                  <Button
                    onClick={() => handleCopy(nlpResult, 'nlp')}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
              <div className="min-h-32 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                {nlpResult ? (
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {nlpResult}
                  </p>
                ) : (
                  <p className="text-gray-400 dark:text-gray-500 italic">
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
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex gap-2">
            <div className="text-blue-600 dark:text-blue-400">ℹ️</div>
            <div>
              <p className="text-gray-900 dark:text-white">
                <span className="font-medium">Context Selected:</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                {contentType && (
                  <span className="inline-block bg-white dark:bg-gray-800 px-3 py-1 rounded-full mr-2 mb-2">
                    {contentTypes.find(ct => ct.value === contentType)?.label}
                  </span>
                )}
                {relationship && (
                  <span className="inline-block bg-white dark:bg-gray-800 px-3 py-1 rounded-full mr-2 mb-2">
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