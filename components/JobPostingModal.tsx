// components/JobPostingModal.tsx
'use client';

import { useState } from 'react';

interface JobPostingFormData {
  title: string;
  description: string;
  has_deadline: boolean;
  deadline_date: string | null;
  deadline_time: string | null;
}

interface JobPostingModalProps {
  onClose: () => void;
  onCreate: (data: JobPostingFormData) => Promise<void>;
}

export default function JobPostingModal({
  onClose,
  onCreate,
}: JobPostingModalProps) {
  const [formData, setFormData] = useState<JobPostingFormData>({
    title: '',
    description: '',
    has_deadline: false,
    deadline_date: null,
    deadline_time: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleToggleDeadline = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setFormData({
      ...formData,
      has_deadline: isChecked,
      // Reset date and time if toggling off
      ...(isChecked ? {} : { deadline_date: null, deadline_time: null }),
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.has_deadline && !formData.deadline_date) {
      newErrors.deadline_date = 'Date is required when deadline is enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreate(formData);
      onClose();
    } catch (err) {
      console.error('Error submitting form:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Create Job Posting
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title*
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    errors.title ? 'border-red-500' : ''
                  }`}
                  placeholder="Job posting title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description*
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    errors.description ? 'border-red-500' : ''
                  }`}
                  placeholder="Describe the job opportunity, requirements, and any other relevant information"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Deadline Toggle */}
              <div className="flex items-center">
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="has_deadline"
                    name="has_deadline"
                    checked={formData.has_deadline}
                    onChange={handleToggleDeadline}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  />
                  <label
                    htmlFor="has_deadline"
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                      formData.has_deadline ? 'bg-indigo-500' : 'bg-gray-300'
                    }`}
                  ></label>
                </div>
                <label
                  htmlFor="has_deadline"
                  className="text-sm font-medium text-gray-700"
                >
                  Set Deadline
                </label>
              </div>

              {/* Date and Time (conditionally shown) */}
              {formData.has_deadline && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="deadline_date"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Deadline Date*
                    </label>
                    <input
                      type="date"
                      id="deadline_date"
                      name="deadline_date"
                      value={formData.deadline_date || ''}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors.deadline_date ? 'border-red-500' : ''
                      }`}
                      min={new Date().toISOString().split('T')[0]} // Prevent past dates
                    />
                    {errors.deadline_date && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.deadline_date}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="deadline_time"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Deadline Time (Optional)
                    </label>
                    <input
                      type="time"
                      id="deadline_time"
                      name="deadline_time"
                      value={formData.deadline_time || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:bg-indigo-300"
              >
                {isSubmitting ? 'Creating...' : 'Create Posting'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CSS for toggle switch */}
      <style jsx>{`
        .toggle-checkbox:checked {
          right: 0;
          border-color: #4f46e5;
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #4f46e5;
        }
        .toggle-label {
          transition: background-color 0.2s ease;
        }
      `}</style>
    </div>
  );
}
