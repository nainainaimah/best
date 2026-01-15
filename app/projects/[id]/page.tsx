'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Project, AnalysisRow } from '@/lib/types/database';
import type { MarketMuseOutput } from '@/lib/types/marketMuse';
import AnalysisViewer from '@/components/AnalysisViewer';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    loadProject();
  }, [params.id]);

  const loadProject = async () => {
    const res = await fetch(`/api/projects/${params.id}`);
    const data = await res.json();
    if (res.ok) {
      setProject(data.project);
      setAnalysis(data.analysis);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  const runAnalysis = async () => {
    setRunning(true);
    try {
      const res = await fetch(`/api/projects/${params.id}/analyse`, {
        method: 'POST',
      });
      if (res.ok) {
        await loadProject();
      } else {
        const data = await res.json();
        alert(`Analysis failed: ${data.error}`);
      }
    } catch (error) {
      alert('Analysis failed');
    }
    setRunning(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Country:</span> {project.country_name}
              </p>
              <p>
                <span className="font-medium">Topic:</span> {project.market_topic}
              </p>
              <p>
                <span className="font-medium">Goal:</span> {project.goal}
              </p>
              <p>
                <span className="font-medium">Created:</span>{' '}
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={runAnalysis}
            disabled={running}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md transition disabled:opacity-50"
          >
            {running ? 'Running Analysis...' : 'Run New Analysis'}
          </button>
        </div>
      </div>

      {!analysis ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">No analysis yet</p>
          <p className="text-sm text-gray-500 mb-6">
            Click "Run New Analysis" to generate an AI-powered market research report
          </p>
        </div>
      ) : (
        <AnalysisViewer
          output={analysis.result as MarketMuseOutput}
          projectName={project.name}
        />
      )}
    </div>
  );
}
