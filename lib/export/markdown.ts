import type { MarketMuseOutput } from '../types/marketMuse';

export function buildMarkdown(output: MarketMuseOutput, projectName: string): string {
  let md = `# ${projectName} – MarketMuse Report\n\n`;

  md += `## Executive Summary\n\n${output.executive_summary}\n\n`;

  md += `## Market Overview\n\n${output.market_overview.narrative}\n\n`;

  if (output.market_overview.key_metrics.length > 0) {
    md += `### Key Metrics\n\n`;
    output.market_overview.key_metrics.forEach((metric) => {
      md += `- **${metric.label}**: ${metric.value}`;
      if (metric.source) {
        md += ` (${metric.source})`;
      }
      md += `\n`;
    });
    md += `\n`;
  }

  md += `## Opportunity Analysis\n\n`;
  output.opportunity_analysis.segments.forEach((seg) => {
    md += `### ${seg.name}\n\n`;
    md += `${seg.description}\n\n`;
    md += `**Why Now**: ${seg.why_now}\n\n`;
  });

  md += `## Risks & Constraints\n\n`;
  md += `**${output.risk_and_constraints.headline}**\n\n`;
  if (output.risk_and_constraints.details.length > 0) {
    output.risk_and_constraints.details.forEach((d) => {
      md += `- ${d}\n`;
    });
    md += `\n`;
  }

  if (output.risk_and_constraints.legal_or_regulatory_flags.length > 0) {
    md += `### Legal / Regulatory Flags\n\n`;
    output.risk_and_constraints.legal_or_regulatory_flags.forEach((f) => {
      md += `- ${f}\n`;
    });
    md += `\n`;
  }

  if (output.risk_and_constraints.data_limitations.length > 0) {
    md += `### Data Limitations\n\n`;
    output.risk_and_constraints.data_limitations.forEach((l) => {
      md += `- ${l}\n`;
    });
    md += `\n`;
  }

  md += `## Scenario Outlook\n\n`;
  md += `### Optimistic\n\n${output.scenario_outlook.optimistic}\n\n`;
  md += `### Base Case\n\n${output.scenario_outlook.base_case}\n\n`;
  md += `### Downside\n\n${output.scenario_outlook.downside}\n\n`;

  md += `## Recommended Next Steps\n\n`;
  output.recommended_next_steps.forEach((step) => {
    md += `- ${step}\n`;
  });
  md += `\n`;

  md += `## Honesty Block\n\n`;
  md += `### Assumptions Made\n\n`;
  output.honesty_block.assumptions_made.forEach((a) => {
    md += `- ${a}\n`;
  });
  md += `\n`;

  md += `### Missing Data to Verify\n\n`;
  output.honesty_block.missing_data_to_verify.forEach((m) => {
    md += `- ${m}\n`;
  });
  md += `\n`;

  md += `### Suggested Professional Advisors\n\n`;
  output.honesty_block.suggested_professional_advisors.forEach((p) => {
    md += `- ${p}\n`;
  });
  md += `\n`;

  return md;
}
