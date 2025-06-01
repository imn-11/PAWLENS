document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const queryImage = document.getElementById("query-image");
  const resultsContainer = document.getElementById("results");
  const section = document.getElementById("section");
  const queryResultZone = document.getElementById("query-result-zone");

  // Handle drag-and-drop events
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    handleFile(e.dataTransfer.files[0]);
  });

  // Handle file input change
  fileInput.addEventListener("change", (e) => {
    handleFile(e.target.files[0]);
  });

  // Handle file upload logic
  function handleFile(file) {
    if (!file) return;

    // Display the uploaded image in the query section
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      queryImage.src = imageUrl;
      queryImage.style.display = "block";

      saveToHistory(imageUrl); // Save the uploaded image to history
      switchPlaces();
    };
    reader.readAsDataURL(file);

    // Send the file to the Flask backend
    const formData = new FormData();
    formData.append("file", file);

    fetch("/search", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        // Clear previous results
        resultsContainer.innerHTML = "";

        // Display query image
        queryImage.src = data.query_image;
        queryImage.style.display = "block";

        // Display similar images
        data.similar_images.forEach((result, index) => {
          const resultItem = document.createElement("div");
          resultItem.className = "result-item";

          const img = document.createElement("img");
          img.src = result.url;
          img.alt = "Similar Image";

          const score = document.createElement("p");
          score.style.fontWeight = "bold";
          score.textContent = `Similarity Score ${result.score}`;

          resultItem.appendChild(img);
          resultItem.appendChild(score);
          resultsContainer.appendChild(resultItem);

          // Add fade-in effect with delay
          setTimeout(() => {
            resultItem.classList.add("fade-in");
          }, index * 200); // 0.2-second delay between each item
        });
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Simulate a clickable area for file upload
  const selectImageDiv = document.getElementById("select-image");
  selectImageDiv.addEventListener("click", () => {
    fileInput.click(); // Trigger the file input dialog
  });

  // Function to switch places between section and query-result-zone
  function switchPlaces() {
    section.classList.add("translate-below");
    queryResultZone.classList.remove("hidden");
    document.getElementById("cat-peeking").classList.add("hidden");
    document.getElementById("white-cat-peeking").classList.add("hidden");
    setTimeout(() => {
      queryResultZone.classList.add("translate-above");
    }, 10); // Small delay to ensure proper rendering
  }

  // Sidebar Toggle
  const sidebar = document.querySelector(".sidebar");
  const btn = document.getElementById("history-btn");
  const btn2 = document.getElementById("history-img");

  btn.onclick = () => {
    sidebar.classList.toggle("open");
    if (sidebar.classList.contains("open")) {
      loadHistory();
    }
  };

  btn2.onclick = () => {
    sidebar.classList.toggle("open");
    if (sidebar.classList.contains("open")) {
      loadHistory();
    }
  };

  // Save uploaded images to local storage and reload history
  function saveToHistory(imageUrl) {
    const history = JSON.parse(localStorage.getItem("uploadedImages")) || [];
    if (!history.some((item) => item.url === imageUrl)) {
      history.push({ url: imageUrl });
      localStorage.setItem("uploadedImages", JSON.stringify(history));
    }
    loadHistory(); // Ensure the history is updated immediately
  }

  // Load history from local storage and display in the sidebar
  function loadHistory() {
    const history = JSON.parse(localStorage.getItem("uploadedImages")) || [];
    const historyImagesContainer = document.getElementById("history-images");
    historyImagesContainer.innerHTML = ""; // Clear previous history

    history.forEach((imageData) => {
      // Create wrapper div
      const historyItem = document.createElement("div");
      historyItem.classList.add("history-item");
      historyItem.style.display = "flex";
      historyItem.style.alignItems = "center";
      historyItem.style.marginBottom = "10px";
      historyItem.style.cursor = "pointer";
      historyItem.style.gap = "10px"; // Space between icon and image

      // Create image element
      const img = document.createElement("img");
      img.src = imageData.url;
      img.alt = "Uploaded Image";
      img.classList.add("history-image");
      img.style.width = "200px";
      img.style.height = "auto";

      // Create icon element for the arrow
      const arrow = document.createElement("i");
      arrow.classList.add("history-arrow", "fa", "fa-angle-right");
      arrow.style.fontSize = "27px";
      arrow.style.color = "var(--text)"; // Dark gray color
      arrow.style.cursor = "pointer";

      // Click event for selecting the image (works on both arrow and image)
      const selectImage = async () => {
        const queryImage = document.getElementById("query-image");

        // Update query image
        queryImage.src = imageData.url;
        queryImage.style.display = "block";

        saveToHistory(imageData.url); // Save again to push to history
        switchPlaces(); // Move the query section into view

        // Fetch image as a Blob to simulate a file upload
        const response = await fetch(imageData.url);
        const blob = await response.blob();
        const file = new File([blob], "history_image.jpg", {
          type: blob.type,
        });

        handleFile(file); // Process as if it was newly uploaded
        fetchSimilarImages(imageData.url); // Fetch similar images
      };

      // Attach click event to both arrow and image
      arrow.addEventListener("click", selectImage);
      img.addEventListener("click", selectImage);

      // Append elements to the wrapper div
      historyItem.appendChild(img);
      historyItem.appendChild(arrow);

      // Append to the container
      historyImagesContainer.appendChild(historyItem);
    });
  }

  // Fetch similar images for a given image URL
  function fetchSimilarImages(imageUrl) {
    // Fetch the image from the URL
    fetch(imageUrl)
      .then((response) => response.blob()) // Convert URL to a Blob (file)
      .then((blob) => {
        const formData = new FormData();
        formData.append("file", blob, "history_image.jpg"); // Attach file

        return fetch("/search", {
          method: "POST",
          body: formData,
        });
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Received data:", data);

        // Update the query-image element with the new image
        const queryImage = document.getElementById("query-image");
        queryImage.src = imageData.url; // Set the clicked history image as the query image
        queryImage.style.display = "block"; // Make sure it's visible

        // Update the UI with similar images
        updateResults(data); // Call function to display similar images
      })
      .catch((error) => {
        console.error("Error fetching similar images:", error);
      });
  }
  function updateResults(data) {
    const resultsContainer = document.getElementById("results");

    // Clear previous results
    resultsContainer.innerHTML = "";

    // Display query image
    const queryImage = document.getElementById("query-image");
    queryImage.src = data.query_image;
    queryImage.style.display = "block"; // Ensure the image is visible

    // Display similar images
    data.similar_images.forEach((result, index) => {
      const resultItem = document.createElement("div");
      resultItem.className = "result-item";

      const img = document.createElement("img");
      img.src = result.url;
      img.alt = "Similar Image";

      const score = document.createElement("p");
      score.style.fontWeight = "bold";
      score.textContent = `Similarity Score: ${result.score}`;

      resultItem.appendChild(img);
      resultItem.appendChild(score);
      resultsContainer.appendChild(resultItem);

      // Add fade-in effect with delay
      setTimeout(() => {
        resultItem.classList.add("fade-in");
      }, index * 200); // 0.2-second delay between each item
    });
  }

  // Load history when the page loads
  loadHistory();
});
function updateQueryImage(imageUrl) {
  const queryImage = document.getElementById("query-img"); // Ensure correct ID
  if (queryImage) {
    queryImage.src = imageUrl;
    queryImage.style.display = "block"; // Ensure visibility
  }
}

// Attach click event listeners to sidebar images
function addSidebarClickEvents() {
  const sidebarImages = document.querySelectorAll(".history-image");
  sidebarImages.forEach((img) => {
    img.addEventListener("click", function () {
      updateQueryImage(this.src);
    });
  });
}

// Ensure the function is called after images are loaded into the sidebar
document.addEventListener("DOMContentLoaded", addSidebarClickEvents);

document.addEventListener("DOMContentLoaded", () => {
  const sunIcon = document.getElementById("sun-icon");
  const moonIcon = document.getElementById("moon-icon");
  const catPeeking = document.getElementById("cat-peeking"); // Light mode image
  const whiteCatPeeking = document.getElementById("white-cat-peeking"); // Dark mode image

  // Set initial state based on the current theme (using darkmode class on body)
  if (document.body.classList.contains("darkmode")) {
    moonIcon.style.visibility = "hidden";
    sunIcon.style.visibility = "visible";
    catPeeking.style.display = "none";
    whiteCatPeeking.style.display = "block";
  } else {
    moonIcon.style.visibility = "visible";
    sunIcon.style.visibility = "hidden";
    catPeeking.style.display = "block";
    whiteCatPeeking.style.display = "none";
  }

  // When the sun icon is clicked, switch to light mode
  sunIcon.addEventListener("click", function () {
    document.body.classList.remove("darkmode");
    sunIcon.style.visibility = "hidden";
    moonIcon.style.visibility = "visible";
    catPeeking.style.display = "block";
    whiteCatPeeking.style.display = "none";
  });

  // When the moon icon is clicked, switch to dark mode
  moonIcon.addEventListener("click", function () {
    document.body.classList.add("darkmode");
    moonIcon.style.visibility = "hidden";
    sunIcon.style.visibility = "visible";
    catPeeking.style.display = "none";
    whiteCatPeeking.style.display = "block";
  });
});
