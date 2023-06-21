
const postsPerPage = 10; // Number of posts to display per page
let currentPage = 1; // Current page number

// Function to fetch posts from the server with pagination
function fetchPosts(page) {
  const url = `/posts?page=${page}&limit=${postsPerPage}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const postContainer = document.getElementById('post-container');
      postContainer.innerHTML = ''; // Clear the existing posts

      if (Array.isArray(data.posts) && data.posts.length > 0) {
        data.posts.forEach(post => {
          const card = document.createElement('div');
          card.classList.add('card');

          const title = document.createElement('h2');
          title.textContent = post.title;

          const content = document.createElement('p');
          content.textContent = post.content;

          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.addEventListener('click', () => {
            deletePost(post.id);
          });

          const editButton = document.createElement('button');
          editButton.textContent = 'Edit';
          editButton.addEventListener('click', () => {
            openEditModal(post.id, post.title, post.content);
          });

          card.appendChild(title);
          card.appendChild(content);
          card.appendChild(deleteButton);
          card.appendChild(editButton);

          postContainer.appendChild(card);
        });
      } else {
        const noPostsMessage = document.createElement('p');
        noPostsMessage.textContent = 'No posts available.';
        postContainer.appendChild(noPostsMessage);
      }

      // Update pagination controls
      const totalPages = data.totalPages;
      updatePaginationControls(currentPage, totalPages);
    })
    .catch(error => console.error('Error fetching posts:', error));
}

// Function to update the pagination controls
function updatePaginationControls(currentPage, totalPages) {
  const paginationContainer = document.getElementById('pagination-container');
  paginationContainer.innerHTML = ''; // Clear the existing pagination controls

  if (totalPages > 1) {
    const previousButton = document.createElement('button');
    previousButton.textContent = 'Previous';
    previousButton.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        fetchPosts(currentPage);
      }
    });

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        fetchPosts(currentPage);
      }
    });

    paginationContainer.appendChild(previousButton);
    paginationContainer.appendChild(document.createTextNode(` Page ${currentPage} of ${totalPages} `));
    paginationContainer.appendChild(nextButton);
  }
}

// Call fetchPosts with the initial page number
fetchPosts(currentPage);


