interface Comment {
  id: string,
  text: string,
  createdAt: string,
  user: {
    photoUrl: string,
    username: string
  }
}

const Comment: React.FC<{comment: Comment}> = ({comment}) =>  {
  
  return (
    <div className='flex w-full flex-col rounded-sm p-2 border border-gray-300'>
      <div className=' flex items-center gap-4 pt-0 pb-6 mx-0 mt-4 none rounded-sm '>
        <img
          src={comment.user.photoUrl}
          alt={comment.user.username}
          className='relative inline-block h-12 w-12 rounded-full object-cover object-center'
        />
        <div className='flex w-full flex-col gap-0.5'>
          <div className='flex items-center justify-between'>
            <h5 className='block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900'>
            {comment.user.username}
            </h5>
          </div>
          <p className='block font-sans text-base antialiased font-light leading-relaxed text-blue-gray-900'>
            {new Date(comment.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  })}
          </p>
        </div>
      </div>
      <div className='p-0 mb-6'>
        <p className='block font-sans text-base antialiased font-light leading-relaxed text-inherit'>
          {comment.text}
        </p>
      </div>
    </div>
  );
}

export default Comment;
