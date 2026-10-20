import { useState } from 'react'
import NavFeed from '../../components/NavFeed'
import Posts from '../../components/Posts'
import MyPosts from '../../components/MyPosts'

function Feed() {
    const [divAtiva, setDivAtiva] = useState('feed')

    return (
        <main className="min-h-screen bg-[#f8f8f8]">
            <NavFeed />

            <div className='min-h-screen bg-[#f8f8f8] pt-20'>
                <div className="mx-auto flex max-w-5xl gap-2 px-6 pt-8">
                    <button
                        onClick={() => setDivAtiva('feed')}
                        className={`rounded-full px-6 py-2.5 text-sm font-semibold transition
                            ${
                                divAtiva === 'feed'
                                    ? 'bg-[#a10b00] text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                            }
                        `}
                    >
                        Feed
                    </button>

                    <button
                        onClick={() => setDivAtiva('my-posts')}
                        className={`rounded-full px-6 py-2.5 text-sm font-semibold transition
                            ${
                                divAtiva === 'my-posts'
                                    ? 'bg-[#a10b00] text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                            }
                        `}
                    >
                        Minhas postagens
                    </button>
                </div>

                <div className="mx-auto max-w-5xl px-6 py-6">
                    {divAtiva === 'feed' && (
                        <Posts />
                    )}

                    {divAtiva === 'my-posts' && (
                        <MyPosts />
                    )}
                </div>
            </div>
        </main>
    )
}

export default Feed