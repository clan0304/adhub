'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import type { JobPosting } from '@/types/findwork';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

// Define the FormData type based on JobPosting, omitting fields that aren't edited through the form
export type JobPostingFormData = {
  title: string;
  description: string;
  has_deadline: boolean;
  deadline_date: string | null;
  deadline_time: string | null;
};

// Define our component props
export interface JobPostingModalProps {
  onClose: () => void;
  onCreate: (data: JobPostingFormData) => Promise<void>;
  initialData?: JobPosting | null;
}

export default function JobPostingModal({
  onClose,
  onCreate,
  initialData,
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

  // If initialData is provided, populate the form for editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        has_deadline: initialData.has_deadline,
        deadline_date: initialData.deadline_date,
        deadline_time: initialData.deadline_time,
      });
    }
  }, [initialData]);

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

  const handleToggleDeadline = (checked: boolean) => {
    setFormData({
      ...formData,
      has_deadline: checked,
      // Reset date and time if toggling off
      ...(checked ? {} : { deadline_date: null, deadline_time: null }),
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">
            {initialData ? 'Edit Job Posting' : 'Create Job Posting'}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Title<span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Job posting title"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm font-medium text-red-500">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description<span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the job opportunity, requirements, and any other relevant information"
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm font-medium text-red-500">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Deadline Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="has_deadline"
                checked={formData.has_deadline}
                onCheckedChange={handleToggleDeadline}
              />
              <Label htmlFor="has_deadline" className="text-sm font-medium">
                Set Deadline
              </Label>
            </div>

            {/* Date and Time (conditionally shown) */}
            {formData.has_deadline && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="deadline_date"
                    className="text-sm font-medium"
                  >
                    Deadline Date<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    id="deadline_date"
                    name="deadline_date"
                    value={formData.deadline_date || ''}
                    onChange={handleChange}
                    className={errors.deadline_date ? 'border-red-500' : ''}
                    min={new Date().toISOString().split('T')[0]} // Prevent past dates
                  />
                  {errors.deadline_date && (
                    <p className="text-sm font-medium text-red-500">
                      {errors.deadline_date}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="deadline_time"
                    className="text-sm font-medium"
                  >
                    Set Date and Time (Optional)
                  </Label>
                  <Input
                    type="time"
                    id="deadline_time"
                    name="deadline_time"
                    value={formData.deadline_time || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting
                  ? `${initialData ? 'Updating...' : 'Creating...'}`
                  : `${initialData ? 'Update Posting' : 'Create Posting'}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
