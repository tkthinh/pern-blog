import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';
import { app } from '../firebase';
import { Button } from 'flowbite-react';
import { FcGoogle } from 'react-icons/fc';

import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { userSuccess, userFailed } from '../redux/userSlice';

export default function OAuth() {
  const auth = getAuth(app);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleOAuth() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const googleRes = await signInWithPopup(auth, provider);
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: googleRes.user.uid,
          name: googleRes.user.displayName,
          email: googleRes.user.email,
          photoUrl: googleRes.user.photoURL,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        dispatch(userSuccess(data.message));
        navigate('/');
      }
    } catch (error) {
      dispatch(userFailed((error as Error).message));
    }
  }

  return (
    <Button
      outline
      type='button'
      className='flex w-full items-center justify-center gap-2'
      onClick={handleOAuth}
    >
      <FcGoogle className='text-xl mr-2 w-5 h-5' />
      <span>Sign in with Google</span>
    </Button>
  );
}
