import { useState } from "react";
import { Textarea } from "@repo/ui/components/atoms/textarea";
import { TextAnalysisResult } from "@repo/ui/types/text-analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/atoms/card";
import { Button } from "@repo/ui/components/atoms/button";

function getSentimentText(score: number): string {
  if (score === 0) return "Neutral 😐";

  return score > 0 ? "Positive 🙂" : "Negative ☹️";
}

export const AnalyzeTextView = () => {
  const [sourceText, setSourceText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TextAnalysisResult | null>(null);
  const apiBaseUrl = "http://localhost:3000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/text-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: sourceText }),
      });

      if (response.ok) {
        const data = await responseon();

        setResult(data.data);
      } else {
        console.error(response.statusText);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Text Analysis App</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Textarea
          className="min-h-[100px]"
          placeholder="Enter your text here..."
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
        />
        <Button disabled={isLoading} type="submit">
          Analyze Text
        </Button>
      </form>

      {result && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="font-semibold">Word Count:</dt>
                <dd>{result.analysis.wordCount}</dd>
              </div>
              <div>
                <dt className="font-semibold">Character Count:</dt>
                <dd>{result.analysis.charCount}</dd>
              </div>
              <div>
                <dt className="font-semibold">Most Frequent Word:</dt>
                <dd>{result.analysis.mostFrequentWord}</dd>
              </div>
              <div>
                <dt className="font-semibold">Sentiment Score:</dt>
                <dd>{getSentimentText(result.analysis.sentimentScore)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="font-semibold">Timestamp:</dt>
                <dd>{new Date(result.timestamp).toLocaleString()}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
