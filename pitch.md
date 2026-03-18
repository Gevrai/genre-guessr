# Genre Quiz — AI-Powered Music Subgenre Training App

A web app quizz that teaches users to identify specific music subgenres more and more in details (e.g. "UK drill" not "rap", "shoegaze" not "rock"). 

The core loop:
    - user is shown a song, with artist and album, as well as an embedded music/video player to listen to the song (from youtube, spotify, or other free)
    - picks the correct subgenre from 4 options
    - gets an explanation of why that's the right genre and how it differs from the distractors, and example of other artists in the same genre

What makes it interesting:
    - there are many song/artist guessing games, but not genres and relationships with other bands
    - questions are generated and curated statically by ai in advance, so the question bank is finite but interesting, and can be filtered by category (metal, electronic, hip-hop…), difficulty, geographic origin (UK, West Africa, Latin America…), and timespan.

Tech stack for MVP: static page, no backend

    Use vite as a bundler builder

    Frontend: Svelte 5, single-page app
    Backend: None for the first phase, all deployed on Github Pages to test the concept.
        - Add a workflow to deploy static page to github pages

    UI/UX: modern design, easy on the eyes, not cluttered.

Questions are in @songs.json. Use these for MVP. WIll add more in a later phase.
