async function deletePost({ id, type }) {
  const reason = prompt('What is the reason for deletion?');

  if (reason) {
    try {
      const response = await fetch(`/api/admin/${id}?reason=${reason}&type=${type}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        alert('Something went wrong.');
        return;
      }

      location.reload();
    } catch (error) {
      alert('Something went wrong.');
    }
  } else {
    alert('Every deletion needs a reason.');
  }
}

async function banUser({ user }) {
  const reason = prompt('What is the reason for the ban?');
  if (reason) {
    const duration = prompt('For how long? (Days)');
    if (duration) {
      console.log('Banning user because of...', reason, duration);
      if (!isNaN(duration)) {
        try {
          const response = await fetch(
            `/api/admin/user/${user}?reason=${reason}&days=${duration}`,
            {
              method: 'DELETE',
            },
          );

          if (!response.ok) {
            alert('Something went wrong.');
            return;
          }

          const jsonResponse = await response.json();
          location.reload();
        } catch (error) {
          console.error('Error banning user:', error);
          alert('Something went wrong.');
        }
      } else {
        alert('Enter a valid number for ban duration.');
      }
    } else {
      alert('Ban needs a duration.');
    }
  } else {
    alert('"Every ban needs a reason" - Sun Tzu');
  }
}

async function unbanUser({ user }) {
  const reason = prompt('What is the reason for unbaning the user?');
  if (reason) {
    try {
      const response = await fetch(`/api/admin/user/${user}?reason=${reason}`, {
        method: 'POST',
      });

      if (!response.ok) {
        console.log(response);
        alert('Something went wrong.');
        return;
      }
      location.reload();
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Something went wrong.');
    }
  } else {
    alert('"Every ban needs a reason" - Sun Tzu');
  }
}

async function pinOrUnpinPost({ id, type, action }) {
  try {
    const response = await fetch(
      `/api/admin/post/${id}?action=${action.toUpperCase()}&type=${type}`,
      {
        method: 'POST',
      },
    );

    if (!response.ok) {
      console.log(response);
      alert('Something went wrong.');
      return;
    }

    const jsonResponse = await response.json();
    location.reload();
  } catch (error) {
    console.error('Error pinning/unpinning post:', error);
    alert('Something went wrong.');
  }
}

async function banIp({ ip }) {
  const reason = prompt('What is the reason for the ban?');
  if (reason) {
    const duration = prompt('For how long? (Days)');
    if (duration) {
      console.log('Banning user because of...', reason, duration);
      if (!isNaN(duration)) {
        try {
          const response = await fetch(
            `/api/admin/ban/ip?reason=${reason}&days=${duration}&ip=${ip}`,
            {
              method: 'DELETE',
            },
          );

          console.log(response);
          if (!response.ok) {
            alert('Something went wrong.');
            return;
          }

          const jsonResponse = await response.json();
          console.log('JSON ', jsonResponse);
          // location.reload();
        } catch (error) {
          console.error('Error banning IP:', error);
          alert('Something went wrong.');
        }
      } else {
        alert('Enter a valid number for ban duration.');
      }
    } else {
      alert('Ban needs a duration.');
    }
  } else {
    alert('"Every ban needs a reason" - Sun Tzu');
  }
}

async function editTopic({ id, type }) {
  const topicDiv = document.querySelector(`div[data-id="${id}"][data-type="${type}"]`);

  if (topicDiv) {
    const input = topicDiv.querySelector('input[name="title"]');
    const textarea = topicDiv.querySelector('textarea[name="body"]');

    const title = input ? input.value : '';
    const body = textarea.value;

    try {
      await fetch(`/api/admin/post?id=${id}&type=${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
        }),
      });

      location.reload();
    } catch (e) {
      console.log(e);
    }
  }
}

// This toggles the admin "edit" functionality.
function editToggle({ type, id }) {
  const div = document.querySelector(`div.edit[data-id="${id}"][data-type="${type}"]`);
  if (div) {
    if (div.style.display === 'none' || !div.style.display) {
      div.style.display = 'flex';
    } else {
      div.style.display = 'none';
    }
  }
}

function attachButtonHandlers() {
  const actions = {
    delete: deletePost,
    ban: banUser,
    unban: unbanUser,
    pin: pinOrUnpinPost,
    unpin: pinOrUnpinPost,
    banip: banIp,
    editTopic: editTopic,
    editToggle: editToggle,
  };

  const adminButtons = document.getElementsByClassName('admin-button');

  for (let i = 0; i < adminButtons.length; i += 1) {
    adminButtons[i].addEventListener('click', () => {
      const { action } = adminButtons[i].dataset;
      actions[action](adminButtons[i].dataset);
    });
  }
}

function main() {
  document.addEventListener('DOMContentLoaded', () => {
    attachButtonHandlers();
  });
}

main();
