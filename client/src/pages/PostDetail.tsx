import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import parse from 'html-react-parser';

import { RootState } from '../redux/store';
import { useSelector, useDispatch } from 'react-redux';
import { actionStart, actionSuccess, actionFailed } from '../redux/actionSlice';

import { useParams } from 'react-router-dom';

import { Alert, Drawer, DrawerHeader, DrawerItems, Spinner } from 'flowbite-react';
import { HiInformationCircle } from 'react-icons/hi';
import { FcLike } from 'react-icons/fc';
import { BsChat } from 'react-icons/bs';
import { HiEnvelope } from 'react-icons/hi2';

import { PostInfo, CommentData } from '@type/global';
import Comment from '../components/Comment';

export default function PostDetail() {
  const { id } = useParams();

  const [postData, setPostData] = useState<PostInfo>();

  const [commentData, setCommentData] = useState<CommentData[]>([]);
  const [reloadComments, setReloadComments] = useState(false);

  const [comment, setComment] = useState<string>('');

  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => setIsOpen(false);

  const { currentUser } = useSelector((state: RootState) => state.user);
  const { loading, error: errorMessage } = useSelector((state: RootState) => state.action);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch(actionStart());

        // Initiate both requests in parallel
        const [postRes, commentRes] = await Promise.all([
          fetch(`/api/post/p/${id}`),
          fetch(`/api/ix/get/comment?postId=${id}`),
        ]);

        const postData = await postRes.json();
        const commentData = await commentRes.json();

        if (!postRes.ok) {
          return dispatch(actionFailed(postData.message));
        }

        if (!commentRes.ok) {
          return dispatch(actionFailed(commentData.message));
        }

        // Update state with the data
        setPostData(postData);
        setCommentData(commentData);
        dispatch(actionSuccess());
      } catch (error) {
        dispatch(actionFailed((error as Error).message));
      }
    };

    fetchData();
  }, [id, reloadComments]);

  function handleComment(event: ChangeEvent<HTMLTextAreaElement>) {
    setComment(event.target.value);
  }

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      dispatch(actionStart());
      const res = await fetch(`/api/ix/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          postId: postData?.id,
          text: comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return dispatch(actionFailed(data.message));
      }
      setComment('');
      setReloadComments((prev) => !prev);
      dispatch(actionSuccess(data.message));
    } catch (error) {
      dispatch(actionFailed((error as Error).message));
    }
  }

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
      {postData && (
        <>
          <div className='mx-auto max-w-6xl flex flex-col gap-6 p-4 md:px-8 md:py-6'>
            <div className='w-full h-auto md:h-[50vh]'>
              <img
                src={postData.poster}
                alt='Poster'
                className='w-full h-full mx-auto aspect-21/9 object-cover rounded-sm'
              />
            </div>
            <h1>{postData.title}</h1>
            <div className='flex items-center space-x-5'>
              <a href={`/user/${[postData.author.id]}`}>
                <img
                  className='h-20 w-20 flex-none rounded-full'
                  src={postData.author.photoUrl}
                  alt={postData.author.username}
                />
              </a>

              <div className='space-y-1'>
                <a
                  href={`/user/${[postData.author.id]}`}
                  className='text-sm font-bold text-gray-900 dark:text-gray-100'
                >
                  {postData.author.username}
                </a>
                <div className='text-xs line-clamp-2 lg:line-clamp-3'>
                  <span>Created at </span>
                  {new Date(postData.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  })}
                </div>
                <button className='flex secondary-btn'>Follow</button>
              </div>
            </div>
            <div className='flex gap-x-3'>
              {postData.postTags!.map((tag) => (
                <a className='underline' key={tag.tagId} href={`/t/${tag.tagId}`}>
                  #{tag.tag.name}
                </a>
              ))}
            </div>
            {parse(postData.content!)}
          </div>
          <div className='fixed bottom-10 w-full flex flex-row justify-center'>
            <div className='flex items-center justify-between border border-gray-400 gap-x-4 bg-neutral-200 dark:bg-white shadow-xs rounded-full px-6 py-4'>
              <button className='border-r-2 pr-4 border-gray-500'>
                <FcLike className='text-2xl' />
              </button>
              <button onClick={() => setIsOpen(true)}>
                <BsChat className='text-2xl text-black' />
              </button>
            </div>
          </div>
          <Drawer open={isOpen} onClose={handleClose} position='right'>
            <DrawerHeader title='Comments' titleIcon={HiEnvelope} />
            <DrawerItems>
              {currentUser && (
                <form className='mb-4' onSubmit={handleCommentSubmit}>
                  <div>
                    <textarea
                      className='block w-full rounded-md border-0 py-1.5 mb-2 text-black shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6 resize-none'
                      id='comment'
                      name='comment'
                      placeholder='Add your comment...'
                      rows={4}
                      value={comment}
                      onChange={handleComment}
                    />
                  </div>
                  <div className='flex justify-end'>
                    <button type='submit' className='primary-btn'>
                      Comment
                    </button>
                  </div>
                </form>
              )}

              <div className='flex flex-col gap-4'>
                {commentData?.length > 0 ? (
                  commentData.map((data) => <Comment key={data.id} comment={data} />)
                ) : (
                  <p>Be the first one to comment!</p>
                )}
              </div>
            </DrawerItems>
          </Drawer>
        </>
      )}
    </>
  );
}
