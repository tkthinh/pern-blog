import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { userStart, userSuccess, userFailed } from '../redux/userSlice';

import { Button, Alert } from 'flowbite-react';
import { ChangeEvent, useEffect, useState } from 'react';

import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from '../firebase';

interface UploadMessage {
  success: boolean;
  message: string;
}

interface FormData {
  username?: string;
  email?: string;
  photoUrl?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function () {
  const { currentUser } = useSelector((state: RootState) => state.user);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileUrl, setImageFileUrl] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<UploadMessage | null>(null);

  const [formData, setFormData] = useState<FormData>({
    username: currentUser?.username,
    email: currentUser?.email,
    photoUrl: currentUser?.photoUrl,
  });

  const dispatch = useDispatch();

  function handleFormInput(event: ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [event.target.id]: event.target.value });
  }

  async function handleProfileUpdate(event: React.ChangeEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      dispatch(userStart());
      const res = await fetch(`/api/user/update/${currentUser?.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        return dispatch(userFailed(data.message));
      }
      dispatch(userSuccess(data.message));
      setActionMessage({
        success: true,
        message: 'User info changed',
      });
    } catch (error) {
      dispatch(userFailed((error as Error).message));
    }
  }

  async function handleChangePassword(event: React.ChangeEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      dispatch(userStart());
      const res = await fetch(`/api/auth/change-password/${currentUser?.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({
          success: false,
          message: data.message,
        });
        return dispatch(userFailed(data.message));
      }
      dispatch(userSuccess(data.message));
      setActionMessage({
        success: true,
        message: 'Password changed',
      });
    } catch (error) {
      setActionMessage({
        success: false,
        message: 'Error changing password',
      });
      dispatch(userFailed((error as Error).message));
    }
  }

  function handleUpdateImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageFileUrl(URL.createObjectURL(file));
    }
  }

  function uploadImage() {
    if (!imageFile) return;

    const maxFileSizeMB = 2;
    const maxFileSize = maxFileSizeMB * 1024 * 1024; // Convert MB to bytes
    if (imageFile.size > maxFileSize) {
      setActionMessage({
        success: false,
        message: `File size exceeds ${maxFileSizeMB}MB limit.`,
      });
      setImageFile(null);
      setImageFileUrl(null);
      return;
    }

    const storage = getStorage(app);
    const fileName = new Date().getTime() + imageFile.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, imageFile);

    uploadTask.on(
      'state_changed',
      null,
      (error) => {
        setActionMessage({
          success: false,
          message: 'Could not upload image',
        });
        setImageFile(null);
        setImageFileUrl(null);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadUrl) => {
          setImageFileUrl(downloadUrl);
          setActionMessage({
            success: true,
            message: 'Profile picture uploaded!',
          });
        });
      }
    );
  }

  useEffect(() => {
    if (imageFile) {
      uploadImage();
    }
  }, [imageFile]);

  useEffect(() => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      photoUrl: imageFileUrl || currentUser?.photoUrl,
    }));
  }, [imageFileUrl]);

  return (
    <div className='flex min-h-full flex-col justify-center gap-y-10 max-w-lg mx-auto'>
      <div className='p-6 lg:px-8 bg-slate-100 dark:bg-neutral-600 shadow-xs rounded-sm'>
        {actionMessage && (
          <Alert color={actionMessage.success ? 'success' : 'failure'}>
            {actionMessage.message}
          </Alert>
        )}
        <div className='sm:mx-auto sm:w-full sm:max-w-sm'>
          <h2 className='text-center text-2xl font-bold leading-9 tracking-tight'>User Info</h2>
        </div>
        <div className='mt-4 sm:mx-auto sm:w-full sm:max-w-sm'>
          <form className='space-y-6' onSubmit={handleProfileUpdate}>
            <div className='group relative h-28 w-28 sm:mx-auto rounded-full border-2 mt-2 border-white bg-gray-100 text-black dark:bg-gray-500 dark:text-white'>
              <label
                htmlFor='avatarFile'
                className='absolute z-10 flex h-full w-full cursor-pointer items-center justify-center rounded-full transition group-hover:bg-black/40'
              >
                <span className='hidden text-3xl text-white group-hover:block'>Edit</span>{' '}
                <input
                  type='file'
                  name='avatarFile'
                  id='avatarFile'
                  className='sr-only'
                  accept='image/*'
                  onChange={handleUpdateImage}
                  multiple={false}
                />
              </label>
              <img
                src={imageFileUrl || currentUser?.photoUrl}
                alt={`${currentUser?.username}'s Avatar`}
                className='w-full h-full rounded-full border-4 border-gray-400 object-cover'
              />
            </div>
            <div>
              <label htmlFor='username' className='block text-sm font-medium leading-6'>
                Username
              </label>
              <div>
                <input
                  id='username'
                  name='username'
                  type='text'
                  disabled
                  value={currentUser?.username}
                  className='cursor-not-allowed block w-full rounded-md border-0 py-1.5 shadow-xs ring-1 ring-inset text-black ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6'
                />
              </div>
            </div>
            <div>
              <label htmlFor='email' className='block text-sm font-medium leading-6'>
                Email address
              </label>
              <div>
                <input
                  id='email'
                  name='email'
                  type='email'
                  disabled
                  value={currentUser?.email}
                  className='cursor-not-allowed block w-full rounded-md border-0 py-1.5 shadow-xs ring-1 ring-inset text-black ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6'
                />
              </div>
            </div>
            <button className='w-full primary-btn'>Update Profile</button>
          </form>
        </div>
      </div>

      <div className='p-6 lg:px-8 bg-slate-100 dark:bg-neutral-600 shadow-xs rounded-sm'>
        <div className='sm:mx-auto sm:w-full sm:max-w-sm'>
          <h2 className='text-center text-2xl font-bold leading-9 tracking-tight'>
            Change Your Password
          </h2>
        </div>

        <div className='mt-4 sm:mx-auto sm:w-full sm:max-w-sm'>
          <form className='space-y-6' onSubmit={handleChangePassword}>
            <div>
              <label htmlFor='current-password' className='block text-sm font-medium leading-6'>
                Current Password
              </label>
              <div>
                <input
                  id='current-password'
                  name='current-password'
                  type='password'
                  minLength={6}
                  required
                  className='block w-full rounded-md border-0 py-1.5 shadow-xs ring-1 ring-inset text-black ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6'
                  onChange={handleFormInput}
                />
              </div>
            </div>
            <div>
              <label htmlFor='new-password' className='block text-sm font-medium leading-6'>
                New Password
              </label>
              <div>
                <input
                  id='new-password'
                  name='new-password'
                  type='password'
                  minLength={6}
                  required
                  className='block w-full rounded-md border-0 py-1.5 shadow-xs ring-1 ring-inset text-black ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6'
                  onChange={handleFormInput}
                />
              </div>
            </div>
            <div>
              <label htmlFor='confirm-password' className='block text-sm font-medium leading-6'>
                Confirm New Password
              </label>
              <div>
                <input
                  id='confirm-password'
                  name='confirm-password'
                  type='password'
                  minLength={6}
                  required
                  className='block w-full rounded-md border-0 py-1.5 shadow-xs ring-1 ring-inset text-black ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6'
                  onChange={handleFormInput}
                />
              </div>
            </div>
            <button className='w-full primary-btn'>Change Password</button>
          </form>
        </div>
      </div>
      <Button color='failure'>Delete Account</Button>
    </div>
  );
}
