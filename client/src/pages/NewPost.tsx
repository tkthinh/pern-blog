import { generateSlug } from '../libs/generate-slug';

import { FaPlus } from 'react-icons/fa';
import { useState, ChangeEvent, KeyboardEvent } from 'react';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { actionStart, actionFailed, actionSuccess } from '../redux/actionSlice';

import { Alert, Spinner } from 'flowbite-react';

import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { app } from '../firebase';

import Quill from '../components/Quill';
import parse from 'html-react-parser';
import { useNavigate } from 'react-router-dom';

interface UploadMessage {
  success: boolean;
  message: string;
}

export default function Home() {
  const user = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [actionMessage, setActionMessage] = useState<UploadMessage | null>(null);

  const [title, setTitle] = useState('');

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterUrl, setPosterUrl] = useState<string>('');

  const [slug, setSlug] = useState<string>('');

  const [tag, setTag] = useState<string>('');
  const [tagList, setTagList] = useState<string[]>([]);

  const [description, setDescription] = useState<string>('');

  const [content, setContent] = useState<string>('');

  function handleTitle(event: ChangeEvent<HTMLInputElement>) {
    const newTitle = event.target.value;
    setTitle(newTitle);
    const autoSlug = generateSlug(newTitle);
    setSlug(autoSlug);
  }

  function handlePoster(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setPosterFile(file);
      setPosterUrl(URL.createObjectURL(file));
    }
  }

  function handleTags(event: ChangeEvent<HTMLInputElement>) {
    setTag(event.target.value.toLowerCase());
  }

  function addTag(event: KeyboardEvent<HTMLInputElement>) {
    if (event.code === 'Space' && tag.trim() !== '') {
      event.preventDefault(); // Prevents adding a space in the input
      setTagList([...tagList, tag.trim()]);
      setTag('');
    }
  }

  function removeTag(removingIndex: number) {
    setTagList(tagList.filter((_, index) => index !== removingIndex));
  }

  async function uploadPoster() {
    if (!posterFile) return;

    const maxFileSizeMB = 4;
    const maxFileSize = maxFileSizeMB * 1024 * 1024; // Convert MB to bytes
    if (posterFile.size > maxFileSize) {
      setActionMessage({
        success: false,
        message: `File size exceeds ${maxFileSizeMB}MB limit.`,
      });
      return setPosterFile(null);
    }

    const storage = getStorage(app);
    const fileName = new Date().getTime() + posterFile.name;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, posterFile);

    const uploadedPosterUrl = await getDownloadURL(storageRef);
    return uploadedPosterUrl;
  }

  async function handleSubmit(event: ChangeEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      dispatch(actionStart());

      if(!tagList || tagList.length === 0 ){
        setActionMessage({
          success: false,
          message: 'Post must contain at least 1 tag',
        });
        return;
      }

      const uploadedPosterUrl = await uploadPoster(); // Wait for poster to upload and get the URL
      if (!uploadedPosterUrl) {
        setActionMessage({
          success: false,
          message: 'Error uploading poster',
        });
        return;
      }

      const newBlog = {
        author: user.currentUser?.id,
        title,
        posterUrl: uploadedPosterUrl,
        slug,
        tagList,
        description,
        content,
      };

      const res = await fetch('/api/post/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlog),
      });

      const data = await res.json();
      if (!res.ok) {
        return dispatch(actionFailed(data.message));
      }
      dispatch(actionSuccess(data.message));
      navigate(`/post/${data.post.id}`);
    } catch (error) {
      dispatch(actionFailed((error as Error).message));
    }
  }

  return (
    <div>
      <h2 className='text-4xl text-center font-semibold py-4'>Create a new post</h2>
      {actionMessage && <Alert color={'failure'}>{actionMessage?.message}</Alert>}
      <div className='grid grid-cols-1 lg:grid-cols-2 p-8 gap-4'>
        {/* Blog Editor */}
        <div className='w-full max-w-3xl p-5 my-6 border border-gray-200 rounded-lg shadow-sm mx-auto'>
          <h2 className='text-3xl font-bold border-b border-gray-400 pb-2 mb-5 '>
            Blog Editor
          </h2>
          <form onSubmit={handleSubmit}>
            <div className='grid gap-4 sm:grid-cols-2 sm:gap-6'>
              {/* Title */}
              <div className='sm:col-span-2'>
                <label htmlFor='title' className='block text-sm font-medium leading-6 mb-2 '>
                  Blog Title
                </label>
                <div className='mt-2'>
                  <input
                    onChange={handleTitle}
                    type='text'
                    value={title}
                    name='title'
                    id='title'
                    required={true}
                    className='block w-full rounded-md border-0 py-1.5 text-black shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6'
                    placeholder='Type the blog title'
                  />
                </div>
              </div>
              {/* Poster */}
              <div className='sm:col-span-2'>
                <label
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                  htmlFor='poster'
                >
                  Upload Poster
                </label>
                <input
                  className='block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-hidden dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-gray-400'
                  id='poster'
                  type='file'
                  accept='image/*'
                  required={true}
                  onChange={handlePoster}
                />
                <p className='mt-1 text-xs text-gray-600 dark:text-gray-300'>
                  Accept poster up to 4MB
                </p>
              </div>
              {/* Slug */}
              <div className='sm:col-span-2'>
                <label htmlFor='slug' className='block text-sm font-medium leading-6 mb-2 '>
                  Blog Slug
                </label>
                <div className='mt-2'>
                  <input
                    onChange={(e) => setSlug(e.target.value)}
                    type='text'
                    value={slug}
                    name='slug'
                    id='slug'
                    disabled={true}
                    required={true}
                    className='block w-full rounded-md border-0 py-1.5 text-black shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6'
                    placeholder='Auto generated'
                  />
                </div>
              </div>
              {/* Tags */}
              <div className='sm:col-span-2 mt-2 flex items-center'>
                <div className='flex'>
                  {tagList.map((tag, index) => (
                    <div
                      key={index}
                      className='flex px-2 py-1 mr-2 rounded-sm bg-slate-300 dark:bg-gray-200 dark:text-black'
                    >
                      <p>{tag} </p>
                      <button
                        className='ml-2 hover:text-red-500'
                        onClick={() => removeTag(index)}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  value={tag}
                  onChange={handleTags}
                  onKeyDown={addTag}
                  type='text'
                  name='tags'
                  id='tags'
                  className='block w-full border-t-0 border-r-0 border-l-0 border-b py-2 border-gray-400 bg-transparent dark:placeholder:text-gray-200 placeholder:text-gray-500 focus:ring-0 sm:text-sm sm:leading-6'
                  placeholder='Add tags'
                />
              </div>
              {/* Description */}
              <div className='sm:col-span-2'>
                <label
                  htmlFor='description'
                  className='block mb-2 text-sm font-medium dark:text-white'
                >
                  Blog Description (maximum 500 characters)
                </label>
                <textarea
                  id='description'
                  rows={4}
                  maxLength={500}
                  onChange={(e) => setDescription(e.target.value)}
                  value={description}
                  required={true}
                  className='block w-full rounded-md border-0 py-1.5 text-black shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6'
                  placeholder='Write a short description'
                ></textarea>
              </div>
              {/* Content */}
              <div className='sm:col-span-2'>
                <label htmlFor='content' className='block mb-2 text-sm font-medium'>
                  Blog Content
                </label>
                <div className='bg-white text-black'>
                  <Quill content={content} setContent={setContent} />
                </div>
              </div>
            </div>
            <button type='submit' className='primary-btn flex mt-4'>
              {user.loading ? (
                <>
                  <Spinner size='sm' />
                  <span className='px-2'>Loading...</span>
                </>
              ) : (
                <>
                  <div>
                    <FaPlus className='w-5 h-5 mr-2' />
                  </div>
                  Write Post
                </>
              )}
            </button>
          </form>
        </div>

        {/* Blog View */}
        <div className=' blog-view w-full max-w-3xl p-8 my-6 border border-gray-200 rounded-lg shadow-sm mx-auto'>
          <h2 className='text-3xl font-bold border-b border-gray-400 pb-2 mb-5 '>Blog View</h2>
          <div className='grid gap-4 sm:grid-cols-2 sm:gap-6'>
            {/* Poster */}
            <div className='sm:col-span-2'>
              {posterUrl === '' ? null : (
                <img
                  src={posterUrl}
                  alt='Poster'
                  className='w-full h-full mx-auto aspect-21/9 object-cover rounded-sm'
                />
              )}
            </div>
            {/* Title */}
            <div className='sm:col-span-2'>
              {title === '' ? (
                <h2 className='block mb-2 text-sm font-medium dark:text-white'>Blog Titlte</h2>
              ) : (
                <div className='mt-2'>
                  <p className='text-2xl font-bold'>{title}</p>
                </div>
              )}
            </div>
            {/* Tags */}
            <div className='sm:col-span-2'>
              {tagList.length === 0 ? (
                <h2 className='block mb-2 text-sm font-medium dark:text-white'>Blog Tags</h2>
              ) : (
                tagList.map((tag) => (
                  <a href='#' className='mr-4 underline'>
                    #{tag}
                  </a>
                ))
              )}
            </div>
            <div className='sm:col-span-full'>
              {content === '' ? (
                <h2 className='block mb-2 text-sm font-medium dark:text-white'>Blog Content</h2>
              ) : (
                <div className='mt-2'>{parse(content)}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
