document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profileForm');
  const preview = document.getElementById('profilePreview');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('companyName').value.trim();
    const phone = document.getElementById('companyPhone').value.trim();
    const logoFile = document.getElementById('companyLogo').files[0];

    if (logoFile) {
      const reader = new FileReader();
      reader.onload = function (event) {
        saveProfile(name, phone, event.target.result);
      };
      reader.readAsDataURL(logoFile);
    } else {
      const existingProfile = JSON.parse(localStorage.getItem('companyProfile')) || {};
      saveProfile(name, phone, existingProfile.logo);
    }
  });

  function saveProfile(name, phone, logoBase64) {
    const profile = { name, phone, logo: logoBase64 };
    localStorage.setItem('companyProfile', JSON.stringify(profile));
    loadProfile();
    alert('Profile saved successfully!');
  }

  function loadProfile() {
    const profile = JSON.parse(localStorage.getItem('companyProfile'));
    if (profile) {
      document.getElementById('previewName').textContent = profile.name;
      document.getElementById('previewPhone').textContent = profile.phone;
      if (profile.logo) {
        document.getElementById('previewLogo').src = profile.logo;
        document.getElementById('previewLogo').style.display = 'block';
      }
      preview.style.display = 'block';
    }
  }

  loadProfile();
});