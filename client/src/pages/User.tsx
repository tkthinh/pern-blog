import { useEffect, useState } from 'react';
import { RootState } from '../redux/store';
import { useSelector, useDispatch } from 'react-redux';
import { actionStart, actionSuccess, actionFailed } from '../redux/actionSlice';
import { useParams } from 'react-router-dom';

import Post from '../components/Post';
import { Alert, Spinner } from 'flowbite-react';
import { HiInformationCircle } from 'react-icons/hi';

import { PostInfo, UserInfo } from '@type/global';

interface UserPost {
  results: PostInfo[];
}

interface UserInfoExtended extends UserInfo {
  postCount: number;
  followingCount: number;
  followerCount: number;
}

export default function User() {
  const { id } = useParams();

  const { currentUser } = useSelector((state: RootState) => state.user);

  const [userInfo, setUserInfo] = useState<UserInfoExtended>();
  const [userPosts, setUserPosts] = useState<UserPost>();

  const { loading, error: errorMessage } = useSelector((state: RootState) => state.action);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      dispatch(actionStart());
      try {
        const [result1, result2] = await Promise.all([
          fetch(`/api/user/${id}`).then((res) => res.json()),
          fetch(`/api/post/search?userId=${id}`).then((res) => res.json()),
        ]);

        setUserInfo(result1);
        setUserPosts(result2);

        dispatch(actionSuccess());
      } catch (error) {
        dispatch(actionFailed((error as Error).message));
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <div className='my-2 sm:mx-auto sm:w-full sm:max-w-sm'>
        {errorMessage && (
          <Alert color='failure' icon={HiInformationCircle}>
            <span className='font-medium'>{errorMessage}</span>
          </Alert>
        )}
        {loading ? (
          <div className='text-center'>
            <Spinner size='xl' />
          </div>
        ) : null}
      </div>
      <div className='flex h-full w-full items-center justify-center'>
        <div className='my-10 mx-auto px-4 md:px-8 flex h-full w-full flex-col items-center justify-center lg:max-w-(--breakpoint-md) xl:max-w-(--breakpoint-lg)'>
          {userInfo && (
            <div className='flex w-full flex-col rounded-3xl bg-white dark:bg-neutral-600 shadow-md'>
              <div className='relative h-44 w-full rounded-t-3xl bg-linear-to-r from-rose-100 to-teal-100 dark:from-blue-200 dark:to-purple-400'>
                <div className='absolute -bottom-10 left-12'>
                  <div className='group relative h-28 w-28 rounded-full border-2 border-white bg-gray-100'>
                    <img
                      src={userInfo.photoUrl}
                      alt={userInfo.username}
                      className='h-full w-full rounded-full'
                    />
                  </div>
                </div>
              </div>
              <div className='mt-10 ml-12 py-4 flex flex-col space-y-1 rounded-b-3xl'>
                <div className=''>
                  <div className='text-2xl font-semibold '>{userInfo.username}</div>
                  <div className='italic'>@dummyusername</div>

                  <div>{userInfo.postCount} Posts</div>
                  <div className='flex items-center space-x-4'>
                    <span>{`${userInfo.followerCount} Followers`}</span>
                    <span>{`${userInfo.followingCount} Followings`}</span>
                  </div>
                  <div>
                    <span>Member since </span>
                    {new Date(userInfo.createdAt!).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className='flex w-full items-center space-x-4 mt-2'>
                    {currentUser?.id === id ? (
                      <button onClick={() => {}} className='primary-btn'>
                        Follow
                      </button>
                    ) : null}

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert('URL copied to clipboard 🥳');
                      }}
                      className='secondary-btn'
                    >
                      <div>Share</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className='my-10 w-full'>
            {userPosts?.results.length === 0 ? (
              <p>This user haven't uploaded any post yet</p>
            ) : (
              userPosts?.results.map((result) => <Post key={result.id} postInfo={result} />)
            )}
          </div>
        </div>
      </div>
    </>
  );
}
