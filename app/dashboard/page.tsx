'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Project } from '@/lib/types/database';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAnalysis, setRunningAnalysis] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth');
        return;
      }
      loadProjects();
    });
  }, [router]);

  const loadProjects = async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data.projects || []);
    setLoading(false);
  };

  const runAnalysis = async (projectId: string) => {
    setRunningAnalysis(projectId);
    try {
      await fetch(`/api/projects/${projectId}/analyse`, {
        method: 'POST',
      });
      router.push(`/projects/${projectId}`);
    } catch (error) {
      alert('Analysis failed');
      setRunningAnalysis(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
        <Link
          href="/projects/new"
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md transition"
        >
          + New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">No projects yet</p>
          <Link
            href="/projects/new"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md transition"
          >
            Create Your First Project
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Topic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{project.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{project.country_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{project.market_topic}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => runAnalysis(project.id)}
                      disabled={runningAnalysis === project.id}
                      className="text-primary-600 hover:text-primary-900 disabled:opacity-50"
                    >
                      {runningAnalysis === project.id ? 'Running...' : 'Run Analysis'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
