import { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { userStart, userSuccess, userFailed } from '../redux/userSlice';

import { Alert, Spinner, Button } from 'flowbite-react';
import { HiInformationCircle } from 'react-icons/hi';
import OAuth from '../components/OAuth';

interface FormData {
  username?: string;
  password?: string;
}

export default function SignIn() {
  const [formData, setFormData] = useState<FormData>({});

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error: errorMessage } = useSelector(
    (state: RootState) => state.user
  );

  function handleFormInput(event: ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [event.target.id]: event.target.value });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      dispatch(userStart());
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        return dispatch(userFailed(data.message));
      }
      dispatch(userSuccess(data.message));
      navigate('/');
    } catch (error) {
      dispatch(userFailed((error as Error).message));
    }
  }

  return (
    <div className='flex min-h-full flex-col justify-center px-6 py-12 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-sm'>
        <h2 className='mt-10 text-center text-2xl font-bold leading-9 tracking-tight'>
          Sign in to your account
        </h2>
      </div>

      <div className='mt-2 sm:mx-auto sm:w-full sm:max-w-sm h-6'>
        {errorMessage && (
          <Alert color='failure' icon={HiInformationCircle}>
            <span className='font-medium'>{errorMessage}</span>
          </Alert>
        )}
      </div>

      <div className='mt-10 sm:mx-auto sm:w-full sm:max-w-sm'>
        <form className='space-y-6' onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor='username'
              className='block text-sm font-medium leading-6'
            >
              Username
            </label>
            <div className='mt-2'>
              <input
                id='username'
                name='username'
                type='text'
                required
                className='block w-full rounded-md border-0 py-1.5 px-2 text-black shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6'
                onChange={handleFormInput}
              />
            </div>
          </div>

          <div>
            <div className='flex items-center justify-between'>
              <label
                htmlFor='password'
                className='block text-sm font-medium leading-6'
              >
                Password
              </label>
              <div className='text-sm'>
                <a
                  href='#'
                  className='font-semibold text-cyan-500 hover:text-cyan-400'
                >
                  Forgot password?
                </a>
              </div>
            </div>
            <div className='mt-2'>
              <input
                id='password'
                name='password'
                type='password'
                minLength={6}
                required
                className='block w-full rounded-md border-0 py-1.5 px-2 text-black shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6'
                onChange={handleFormInput}
              />
            </div>
          </div>

          <div>
            <Button
              type='submit'
              className='flex w-full justify-center'
              size='md'
            >
              {loading ? (
                <>
                  <Spinner size='sm' />
                  <span className='px-2'>Loading...</span>
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </div>

          <OAuth />
        </form>

        <p className='mt-10 text-center text-sm text-gray-500'>
          Not a member?
          <a
            href='/signup'
            className='font-semibold leading-6 text-cyan-500 hover:text-cyan-400'
          >
            {' '}
            Sign up now!
          </a>
        </p>
      </div>
    </div>
  );
}
