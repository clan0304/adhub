// components/ProfileSetupForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useProfileSetup } from '@/contexts/ProfileSetupContext';
import Image from 'next/image';
import { getData } from 'country-list';

export default function ProfileSetupForm() {
  const {
    currentStep,
    profileData,
    loading,
    error,
    updateProfileData,
    nextStep,
    prevStep,
    submitProfile,
    setProfilePhoto,
    checkUsernameAvailability,
    checkPhoneAvailability,
  } = useProfileSetup();

  // Local validation states
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [phoneAvailable, setPhoneAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [countries, setCountries] = useState<{ code: string; name: string }[]>(
    []
  );

  // Load countries
  useEffect(() => {
    // Get countries from country-list
    const countryData = getData();

    const modifiedCountries = countryData.map((country) => {
      if (country.code === 'TW') {
        return { ...country, name: 'Taiwan' };
      }
      return country;
    });

    // Sort by name
    modifiedCountries.sort((a, b) => a.name.localeCompare(b.name));

    setCountries(modifiedCountries);
  }, []);

  // Handle username check with debounce
  useEffect(() => {
    const checkUsername = async () => {
      if (profileData.username.length < 3) {
        setUsernameAvailable(null);
        setUsernameError('Username must be at least 3 characters');
        return;
      }

      // Validate username format (letters, numbers, underscores only)
      if (!/^[a-zA-Z0-9_]+$/.test(profileData.username)) {
        setUsernameAvailable(false);
        setUsernameError(
          'Username can only contain letters, numbers, and underscores'
        );
        return;
      }

      const available = await checkUsernameAvailability(profileData.username);
      setUsernameAvailable(available);
      setUsernameError(available ? null : 'Username is already taken');
    };

    if (profileData.username) {
      const timer = setTimeout(checkUsername, 500);
      return () => clearTimeout(timer);
    } else {
      setUsernameAvailable(null);
      setUsernameError(null);
    }
  }, [profileData.username, checkUsernameAvailability]);

  // Handle phone check with debounce
  useEffect(() => {
    const checkPhone = async () => {
      // Basic phone validation
      if (!/^\+?[0-9]{8,15}$/.test(profileData.phoneNumber)) {
        setPhoneAvailable(null);
        setPhoneError('Please enter a valid phone number');
        return;
      }

      const available = await checkPhoneAvailability(profileData.phoneNumber);
      setPhoneAvailable(available);
      setPhoneError(available ? null : 'Phone number is already registered');
    };

    if (profileData.phoneNumber) {
      const timer = setTimeout(checkPhone, 500);
      return () => clearTimeout(timer);
    } else {
      setPhoneAvailable(null);
      setPhoneError(null);
    }
  }, [profileData.phoneNumber, checkPhoneAvailability]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        setValidationErrors({
          ...validationErrors,
          profilePhoto: 'Please upload a JPEG or PNG image',
        });
        return;
      }

      if (file.size > maxSize) {
        setValidationErrors({
          ...validationErrors,
          profilePhoto: 'Image size should be less than 5MB',
        });
        return;
      }

      setProfilePhoto(file);
      setValidationErrors({
        ...validationErrors,
        profilePhoto: '',
      });
    }
  };

  // Validate step 1
  const validateStepOne = () => {
    if (!profileData.userType) {
      setValidationErrors({
        ...validationErrors,
        userType: 'Please select your account type',
      });
      return false;
    }
    return true;
  };

  // Validate step 2
  const validateStepTwo = () => {
    const errors: Record<string, string> = {};

    if (!profileData.username) {
      errors.username = 'Username is required';
    } else if (!usernameAvailable) {
      errors.username = usernameError || 'Invalid username';
    }

    if (!profileData.firstName) {
      errors.firstName = 'First name is required';
    }

    if (!profileData.lastName) {
      errors.lastName = 'Last name is required';
    }

    if (!profileData.phoneNumber) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!phoneAvailable) {
      errors.phoneNumber = phoneError || 'Invalid phone number';
    }

    if (!profileData.city) {
      errors.city = 'City is required';
    }

    if (!profileData.country) {
      errors.country = 'Please select a country';
    }

    // Social media URL validation (only if provided)
    if (
      profileData.instagramUrl &&
      !profileData.instagramUrl.includes('instagram.com')
    ) {
      errors.instagramUrl = 'Please enter a valid Instagram URL';
    }

    if (
      profileData.youtubeUrl &&
      !profileData.youtubeUrl.includes('youtube.com')
    ) {
      errors.youtubeUrl = 'Please enter a valid YouTube URL';
    }

    if (
      profileData.tiktokUrl &&
      !profileData.tiktokUrl.includes('tiktok.com')
    ) {
      errors.tiktokUrl = 'Please enter a valid TikTok URL';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle next button click
  const handleNext = () => {
    if (currentStep === 1 && validateStepOne()) {
      nextStep();
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStepTwo()) {
      await submitProfile();
    } else {
      // Scroll to the first error
      const firstErrorElement = document.querySelector('[data-error="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center w-full">
          <div
            className={`rounded-full h-10 w-10 flex items-center justify-center 
            ${
              currentStep >= 1
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            1
          </div>
          <div
            className={`h-1 flex-1 mx-4 ${
              currentStep >= 2 ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          ></div>
          <div
            className={`rounded-full h-10 w-10 flex items-center justify-center 
            ${
              currentStep >= 2
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            2
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Step 1 - User Type Selection */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold mb-4">
            Choose Your Account Type
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => updateProfileData({ userType: 'content_creator' })}
              className={`border rounded-lg p-6 cursor-pointer hover:border-indigo-500 ${
                profileData.userType === 'content_creator'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200'
              }`}
            >
              <h3 className="text-lg font-medium">Content Creator</h3>
              <p className="text-gray-500 mt-2">
                For influencers, artists, and content producers looking to
                showcase their work and collaborate with businesses.
              </p>
            </div>

            <div
              onClick={() => updateProfileData({ userType: 'business_owner' })}
              className={`border rounded-lg p-6 cursor-pointer hover:border-indigo-500 ${
                profileData.userType === 'business_owner'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200'
              }`}
            >
              <h3 className="text-lg font-medium">Business Owner</h3>
              <p className="text-gray-500 mt-2">
                For businesses and brands looking to connect with creators and
                promote their products or services.
              </p>
            </div>
          </div>
          {validationErrors.userType && (
            <p className="text-red-500 text-sm mt-2">
              {validationErrors.userType}
            </p>
          )}

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2 - Profile Details */}
      {currentStep === 2 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Username */}
            <div
              className="sm:col-span-3"
              data-error={!!validationErrors.username || false}
            >
              <label
                htmlFor="username"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Username*
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="username"
                  value={profileData.username}
                  onChange={(e) =>
                    updateProfileData({ username: e.target.value })
                  }
                  className={`block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ${
                    usernameError ? 'ring-red-500' : 'ring-gray-300'
                  } focus:ring-2 focus:ring-inset focus:ring-indigo-600`}
                />
                {usernameError ? (
                  <p className="text-red-500 text-sm mt-1">{usernameError}</p>
                ) : (
                  usernameAvailable &&
                  profileData.username && (
                    <p className="text-green-500 text-sm mt-1">
                      Username is available
                    </p>
                  )
                )}
                {validationErrors.username && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.username}
                  </p>
                )}
              </div>
            </div>

            {/* Profile Photo */}
            <div
              className="sm:col-span-3"
              data-error={!!validationErrors.profilePhoto || false}
            >
              <label
                htmlFor="profilePhoto"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Profile Photo
              </label>
              <div className="mt-2 flex items-center gap-4">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {profileData.profilePhotoUrl ? (
                    <Image
                      src={profileData.profilePhotoUrl}
                      alt="Profile Preview"
                      className="h-full w-full object-cover"
                      width={20}
                      height={20}
                    />
                  ) : (
                    <svg
                      className="h-12 w-12 text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </div>
                <input
                  type="file"
                  id="profilePhoto"
                  accept="image/png, image/jpeg"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
              {validationErrors.profilePhoto && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.profilePhoto}
                </p>
              )}
            </div>

            {/* First Name */}
            <div
              className="sm:col-span-3"
              data-error={!!validationErrors.firstName || false}
            >
              <label
                htmlFor="firstName"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                First Name*
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) =>
                    updateProfileData({ firstName: e.target.value })
                  }
                  className={`block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ${
                    validationErrors.firstName
                      ? 'ring-red-500'
                      : 'ring-gray-300'
                  } focus:ring-2 focus:ring-inset focus:ring-indigo-600`}
                />
                {validationErrors.firstName && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.firstName}
                  </p>
                )}
              </div>
            </div>

            {/* Last Name */}
            <div
              className="sm:col-span-3"
              data-error={!!validationErrors.lastName || false}
            >
              <label
                htmlFor="lastName"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Last Name*
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) =>
                    updateProfileData({ lastName: e.target.value })
                  }
                  className={`block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ${
                    validationErrors.lastName ? 'ring-red-500' : 'ring-gray-300'
                  } focus:ring-2 focus:ring-inset focus:ring-indigo-600`}
                />
                {validationErrors.lastName && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div
              className="sm:col-span-3"
              data-error={!!validationErrors.phoneNumber || false}
            >
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Phone Number*
              </label>
              <div className="mt-2">
                <input
                  type="tel"
                  id="phoneNumber"
                  value={profileData.phoneNumber}
                  onChange={(e) =>
                    updateProfileData({ phoneNumber: e.target.value })
                  }
                  className={`block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ${
                    phoneError ? 'ring-red-500' : 'ring-gray-300'
                  } focus:ring-2 focus:ring-inset focus:ring-indigo-600`}
                  placeholder="+1234567890"
                />
                {phoneError ? (
                  <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                ) : (
                  phoneAvailable &&
                  profileData.phoneNumber && (
                    <p className="text-green-500 text-sm mt-1">
                      Phone number is available
                    </p>
                  )
                )}
                {validationErrors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.phoneNumber}
                  </p>
                )}
              </div>
            </div>

            {/* City */}
            <div
              className="sm:col-span-3"
              data-error={!!validationErrors.city || false}
            >
              <label
                htmlFor="city"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                City*
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="city"
                  value={profileData.city}
                  onChange={(e) => updateProfileData({ city: e.target.value })}
                  className={`block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ${
                    validationErrors.city ? 'ring-red-500' : 'ring-gray-300'
                  } focus:ring-2 focus:ring-inset focus:ring-indigo-600`}
                />
                {validationErrors.city && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.city}
                  </p>
                )}
              </div>
            </div>

            {/* Country */}
            <div
              className="sm:col-span-3"
              data-error={!!validationErrors.country || false}
            >
              <label
                htmlFor="country"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Country*
              </label>
              <div className="mt-2">
                <select
                  id="country"
                  value={profileData.country}
                  onChange={(e) =>
                    updateProfileData({ country: e.target.value })
                  }
                  className={`block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ${
                    validationErrors.country ? 'ring-red-500' : 'ring-gray-300'
                  } focus:ring-2 focus:ring-inset focus:ring-indigo-600`}
                >
                  <option value="" disabled>
                    Select a country
                  </option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {validationErrors.country && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.country}
                  </p>
                )}
              </div>
            </div>

            {/* Content Creator Specific Fields */}
            {profileData.userType === 'content_creator' && (
              <>
                <div className="sm:col-span-6">
                  <h3 className="text-lg font-medium mb-4">
                    Content Creator Details
                  </h3>
                </div>

                {/* Instagram */}
                <div
                  className="sm:col-span-4"
                  data-error={!!validationErrors.instagramUrl || false}
                >
                  <label
                    htmlFor="instagramUrl"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Instagram URL (Optional)
                  </label>
                  <div className="mt-2">
                    <input
                      type="url"
                      id="instagramUrl"
                      value={profileData.instagramUrl}
                      onChange={(e) =>
                        updateProfileData({ instagramUrl: e.target.value })
                      }
                      className={`block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ${
                        validationErrors.instagramUrl
                          ? 'ring-red-500'
                          : 'ring-gray-300'
                      } focus:ring-2 focus:ring-inset focus:ring-indigo-600`}
                      placeholder="https://instagram.com/username"
                    />
                    {validationErrors.instagramUrl && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.instagramUrl}
                      </p>
                    )}
                  </div>
                </div>

                {/* YouTube */}
                <div
                  className="sm:col-span-4"
                  data-error={!!validationErrors.youtubeUrl || false}
                >
                  <label
                    htmlFor="youtubeUrl"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    YouTube URL (Optional)
                  </label>
                  <div className="mt-2">
                    <input
                      type="url"
                      id="youtubeUrl"
                      value={profileData.youtubeUrl}
                      onChange={(e) =>
                        updateProfileData({ youtubeUrl: e.target.value })
                      }
                      className={`block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ${
                        validationErrors.youtubeUrl
                          ? 'ring-red-500'
                          : 'ring-gray-300'
                      } focus:ring-2 focus:ring-inset focus:ring-indigo-600`}
                      placeholder="https://youtube.com/c/username"
                    />
                    {validationErrors.youtubeUrl && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.youtubeUrl}
                      </p>
                    )}
                  </div>
                </div>

                {/* TikTok */}
                <div
                  className="sm:col-span-4"
                  data-error={!!validationErrors.tiktokUrl || false}
                >
                  <label
                    htmlFor="tiktokUrl"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    TikTok URL (Optional)
                  </label>
                  <div className="mt-2">
                    <input
                      type="url"
                      id="tiktokUrl"
                      value={profileData.tiktokUrl}
                      onChange={(e) =>
                        updateProfileData({ tiktokUrl: e.target.value })
                      }
                      className={`block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ${
                        validationErrors.tiktokUrl
                          ? 'ring-red-500'
                          : 'ring-gray-300'
                      } focus:ring-2 focus:ring-inset focus:ring-indigo-600`}
                      placeholder="https://tiktok.com/@username"
                    />
                    {validationErrors.tiktokUrl && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.tiktokUrl}
                      </p>
                    )}
                  </div>
                </div>

                {/* Public Profile Toggle */}
                <div className="sm:col-span-6">
                  <div className="flex items-center">
                    <input
                      id="isPublic"
                      type="checkbox"
                      checked={profileData.isPublic}
                      onChange={(e) =>
                        updateProfileData({ isPublic: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <label
                      htmlFor="isPublic"
                      className="ml-2 block text-sm font-medium text-gray-900"
                    >
                      Make my profile public (visible to others)
                    </label>
                  </div>
                </div>

                {/* Open to Collaborate */}
                <div className="sm:col-span-6">
                  <div className="flex items-center">
                    <input
                      id="openToCollaborate"
                      type="checkbox"
                      checked={profileData.openToCollaborate}
                      onChange={(e) =>
                        updateProfileData({
                          openToCollaborate: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <label
                      htmlFor="openToCollaborate"
                      className="ml-2 block text-sm font-medium text-gray-900"
                    >
                      Open to collaborations (businesses can contact you)
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-300"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
