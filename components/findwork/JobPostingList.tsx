// components/findwork/JobPostingsList.tsx
import JobPostingCard from '@/components/JobPostingCard';
import { JobPosting } from '@/types/findwork';

interface JobPostingsListProps {
  loading: boolean;
  error: string | null;
  filteredJobPostings: JobPosting[];
  allJobPostings: JobPosting[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any; // Using any here to match the parent component typing
  isBusinessOwner: boolean;
  showMyPostingsOnly: boolean;
  myPostingsCount: number;
  setIsModalOpen: (isOpen: boolean) => void;
  handleDeleteJobPosting: (id: string) => Promise<void>;
  handleSaveJob: (jobId: string, isSaved: boolean) => Promise<void>;
  handleEditJobPosting?: (job: JobPosting) => void;
}

export function JobPostingsList({
  loading,
  error,
  filteredJobPostings,
  allJobPostings,
  session,
  isBusinessOwner,
  showMyPostingsOnly,
  myPostingsCount,
  setIsModalOpen,
  handleDeleteJobPosting,
  handleSaveJob,
  handleEditJobPosting,
}: JobPostingsListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (filteredJobPostings.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {allJobPostings.length === 0 ? (
          <>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No job postings yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {isBusinessOwner
                ? 'Get started by creating your first job posting.'
                : 'Check back later for new opportunities.'}
            </p>
          </>
        ) : showMyPostingsOnly && myPostingsCount === 0 ? (
          <>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              You haven&apos;t created any job postings yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first job posting.
            </p>
          </>
        ) : (
          <>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No matching job postings
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search filters to see more results.
            </p>
          </>
        )}
        {isBusinessOwner &&
          (allJobPostings.length === 0 ||
            (showMyPostingsOnly && myPostingsCount === 0)) && (
            <div className="mt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                Create Job Posting
              </button>
            </div>
          )}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredJobPostings.map((job) => (
        <JobPostingCard
          key={job.id}
          job={job}
          isOwner={job.user_id === session?.user?.id}
          onDelete={handleDeleteJobPosting}
          onEdit={handleEditJobPosting}
          onSaveToggle={(isSaved: boolean) => handleSaveJob(job.id, isSaved)}
          isSaved={job.is_saved || false}
        />
      ))}
    </div>
  );
}
