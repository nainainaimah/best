'use client';

import type { MarketMuseOutput } from '@/lib/types/marketMuse';
import { buildMarkdown } from '@/lib/export/markdown';
import { buildSlideOutline } from '@/lib/export/slides';

export default function AnalysisViewer({
  output,
  projectName,
}: {
  output: MarketMuseOutput;
  projectName: string;
}) {
  const copySlideOutline = () => {
    const outline = buildSlideOutline(output);
    navigator.clipboard.writeText(outline);
    alert('Slide outline copied to clipboard');
  };

  const downloadMarkdown = () => {
    const md = buildMarkdown(output, projectName);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketmuse-${projectName.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6 flex justify-end space-x-4">
        <button
          onClick={copySlideOutline}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md transition"
        >
          Copy Slide Outline
        </button>
        <button
          onClick={downloadMarkdown}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md transition"
        >
          Download Markdown
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Executive Summary</h2>
        <p className="text-gray-700 leading-relaxed">{output.executive_summary}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Market Overview</h2>
        <p className="text-gray-700 leading-relaxed mb-6">{output.market_overview.narrative}</p>

        {output.market_overview.key_metrics.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {output.market_overview.key_metrics.map((metric, idx) => (
                <div key={idx} className="bg-primary-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">{metric.label}</div>
                  <div className="text-xl font-bold text-primary-700">{metric.value}</div>
                  {metric.source && (
                    <div className="text-xs text-gray-500 mt-1">{metric.source}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Opportunity Analysis</h2>
        <div className="space-y-6">
          {output.opportunity_analysis.segments.map((segment, idx) => (
            <div key={idx} className="border-l-4 border-primary-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{segment.name}</h3>
              <p className="text-gray-700 mb-2">{segment.description}</p>
              <p className="text-sm text-primary-700">
                <span className="font-medium">Why Now:</span> {segment.why_now}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Risks & Constraints</h2>
        <p className="text-lg font-semibold text-red-700 mb-4">
          {output.risk_and_constraints.headline}
        </p>

        {output.risk_and_constraints.details.length > 0 && (
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700">
            {output.risk_and_constraints.details.map((detail, idx) => (
              <li key={idx}>{detail}</li>
            ))}
          </ul>
        )}

        {output.risk_and_constraints.legal_or_regulatory_flags.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Legal / Regulatory Flags
            </h3>
            <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700">
              {output.risk_and_constraints.legal_or_regulatory_flags.map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          </>
        )}

        {output.risk_and_constraints.data_limitations.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Data Limitations</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {output.risk_and_constraints.data_limitations.map((limitation, idx) => (
                <li key={idx}>{limitation}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Scenario Outlook</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-700 mb-3">Optimistic</h3>
            <p className="text-gray-700 text-sm">{output.scenario_outlook.optimistic}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-700 mb-3">Base Case</h3>
            <p className="text-gray-700 text-sm">{output.scenario_outlook.base_case}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-700 mb-3">Downside</h3>
            <p className="text-gray-700 text-sm">{output.scenario_outlook.downside}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommended Next Steps</h2>
        <ul className="space-y-2">
          {output.recommended_next_steps.map((step, idx) => (
            <li key={idx} className="flex items-start">
              <span className="text-primary-600 mr-2">✓</span>
              <span className="text-gray-700">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Honesty Block</h2>

        <h3 className="text-lg font-semibold text-gray-800 mb-3">Assumptions Made</h3>
        <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700">
          {output.honesty_block.assumptions_made.map((assumption, idx) => (
            <li key={idx}>{assumption}</li>
          ))}
        </ul>

        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Missing Data to Verify
        </h3>
        <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700">
          {output.honesty_block.missing_data_to_verify.map((data, idx) => (
            <li key={idx}>{data}</li>
          ))}
        </ul>

        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Suggested Professional Advisors
        </h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          {output.honesty_block.suggested_professional_advisors.map((advisor, idx) => (
            <li key={idx}>{advisor}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
