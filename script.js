// Discover Lesotho - page behaviour

document.addEventListener("DOMContentLoaded", function () {
  // Current year in the footer
  var year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // Light and dark theme, remembered between visits
  var themeButton = document.getElementById("themeToggle");
  var savedTheme = null;

  try {
    savedTheme = localStorage.getItem("lesotho-theme");
  } catch (error) {
    savedTheme = null;
  }

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }

  function updateThemeButton() {
    if (!themeButton) return;
    var isDark = document.body.classList.contains("dark");
    themeButton.textContent = isDark ? "Light mode" : "Dark mode";
    themeButton.setAttribute("aria-pressed", isDark ? "true" : "false");
  }

  updateThemeButton();

  if (themeButton) {
    themeButton.addEventListener("click", function () {
      document.body.classList.toggle("dark");
      var isDark = document.body.classList.contains("dark");
      try {
        localStorage.setItem("lesotho-theme", isDark ? "dark" : "light");
      } catch (error) {
        // The page still works if storage is blocked.
      }
      updateThemeButton();
    });
  }

  // Destination search and category filter
  var searchBox = document.getElementById("destinationSearch");
  var filterButtons = document.querySelectorAll("[data-filter]");
  var destinationItems = document.querySelectorAll(".destination-item");
  var noResults = document.getElementById("noResults");
  var activeFilter = "all";

  function filterDestinations() {
    if (!destinationItems.length) return;

    var term = searchBox ? searchBox.value.trim().toLowerCase() : "";
    var visible = 0;

    destinationItems.forEach(function (item) {
      var categories = (item.getAttribute("data-category") || "").split(" ");
      var extraWords = item.getAttribute("data-search") || "";
      var text = item.textContent.toLowerCase() + " " + extraWords.toLowerCase();

      var categoryMatch = activeFilter === "all" || categories.indexOf(activeFilter) !== -1;
      var textMatch = term === "" || text.indexOf(term) !== -1;
      var show = categoryMatch && textMatch;

      item.classList.toggle("d-none", !show);
      if (show) visible++;
    });

    if (noResults) {
      noResults.classList.toggle("d-none", visible > 0);
    }
  }

  if (searchBox) {
    searchBox.addEventListener("input", filterDestinations);
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.getAttribute("data-filter");
      filterButtons.forEach(function (other) {
        other.classList.toggle("active", other === button);
      });
      filterDestinations();
    });
  });

  // Destination details modal
  var detailsModalElement = document.getElementById("detailsModal");

  if (detailsModalElement && window.bootstrap) {
    var detailsModal = bootstrap.Modal.getOrCreateInstance(detailsModalElement);
    var detailsTitle = document.getElementById("detailsTitle");
    var detailsBody = document.getElementById("detailsBody");

    document.querySelectorAll(".details-btn").forEach(function (button) {
      button.addEventListener("click", function () {
        detailsTitle.textContent = button.getAttribute("data-title");
        detailsBody.textContent = button.getAttribute("data-details");
        detailsModal.show();
      });
    });
  }

  // Gallery viewer
  var galleryItems = Array.from(document.querySelectorAll(".gallery-item"));
  var galleryModalElement = document.getElementById("galleryModal");

  if (galleryItems.length && galleryModalElement && window.bootstrap) {
    var galleryModal = bootstrap.Modal.getOrCreateInstance(galleryModalElement);
    var galleryImage = document.getElementById("galleryImage");
    var galleryCaption = document.getElementById("galleryCaption");
    var galleryCounter = document.getElementById("galleryCounter");
    var currentImage = 0;

    function showImage(index) {
      currentImage = (index + galleryItems.length) % galleryItems.length;
      var item = galleryItems[currentImage];
      var image = item.querySelector("img");

      galleryImage.src = image.getAttribute("src");
      galleryImage.alt = image.getAttribute("alt");
      galleryCaption.textContent = item.getAttribute("data-caption") || image.getAttribute("alt");
      galleryCounter.textContent = (currentImage + 1) + " of " + galleryItems.length;
    }

    galleryItems.forEach(function (item, index) {
      item.addEventListener("click", function () {
        showImage(index);
        galleryModal.show();
      });
    });

    var previousButton = document.getElementById("galleryPrev");
    var nextButton = document.getElementById("galleryNext");

    if (previousButton) {
      previousButton.addEventListener("click", function () {
        showImage(currentImage - 1);
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        showImage(currentImage + 1);
      });
    }

    galleryModalElement.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") showImage(currentImage - 1);
      if (event.key === "ArrowRight") showImage(currentImage + 1);
    });
  }

  // Form checking
  function showAlert(box, type, message) {
    if (!box) return;
    box.className = "alert alert-" + type;
    box.textContent = message;
  }

  function setUpForm(formId, alertId, successMessage) {
    var form = document.getElementById(formId);
    var alertBox = document.getElementById(alertId);
    if (!form || !alertBox) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      form.classList.add("was-validated");

      // A date in the past is not a useful arrival date.
      var dateInput = form.querySelector('input[type="date"]');
      if (dateInput) {
        dateInput.setCustomValidity("");
        if (dateInput.value) {
          var chosen = new Date(dateInput.value + "T00:00:00");
          var today = new Date();
          today.setHours(0, 0, 0, 0);
          if (chosen < today) {
            dateInput.setCustomValidity("Choose today or a later date.");
          }
        }
      }

      if (!form.checkValidity()) {
        showAlert(alertBox, "danger", "Please check the highlighted fields and try again.");
        var firstInvalid = form.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      showAlert(alertBox, "success", successMessage);
      form.reset();
      form.classList.remove("was-validated");
      updateEstimate();
    });
  }

  setUpForm(
    "bookingForm",
    "bookingAlert",
    "Thanks. Your enquiry passed the checks. This is a demo form, so nothing was sent or booked."
  );

  setUpForm(
    "contactForm",
    "contactAlert",
    "Thanks. Your message passed the checks. This is a demo form, so nothing was sent."
  );

  // Rough budget estimate
  var peopleInput = document.getElementById("bookingPeople");
  var daysInput = document.getElementById("bookingDays");
  var budgetInput = document.getElementById("bookingBudget");
  var budgetTotal = document.getElementById("budgetTotal");

  function updateEstimate() {
    if (!peopleInput || !daysInput || !budgetInput || !budgetTotal) return;

    var people = Math.max(1, Number(peopleInput.value) || 1);
    var days = Math.max(1, Number(daysInput.value) || 1);
    var rate = Math.max(0, Number(budgetInput.value) || 0);
    var total = people * days * rate;

    budgetTotal.textContent = "M" + total.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  [peopleInput, daysInput, budgetInput].forEach(function (input) {
    if (input) input.addEventListener("input", updateEstimate);
  });

  updateEstimate();

  // Today is the earliest date in the booking form
  var bookingDate = document.getElementById("bookingDate");
  if (bookingDate) {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");
    bookingDate.min = now.getFullYear() + "-" + month + "-" + day;
  }
});
