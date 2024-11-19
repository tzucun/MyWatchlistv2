let currentSlide = 0;
        const images = document.querySelectorAll('.images img');
        const totalSlides = images.length;
        const imagesContainer = document.querySelector('.images');

        // Set the width of the images container based on the number of images
        imagesContainer.style.width = `${totalSlides * 100}%`; // Each image takes 100% of the container width

        function showSlide(index) {
            // Ensure the index wraps around
            if (index < 0) {
                currentSlide = totalSlides - 1;
            } else if (index >= totalSlides) {
                currentSlide = 0;
            } else {
                currentSlide = index;
            }
            
            // Calculate the new transform value
            const offset = -currentSlide * (100 / totalSlides); // Each image takes 100% of the width
            imagesContainer.style.transform = `translateX(${offset}%)`;
        }

        function nextSlide() {
            showSlide(currentSlide + 1);
        }

        function prevSlide() {
            showSlide(currentSlide - 1);
        }

        // Optional: Auto-slide every 5 seconds
        setInterval(nextSlide, 5000);