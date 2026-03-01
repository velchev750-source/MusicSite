import { supabase } from "./supabaseClient.js";

type MediaType = "audio" | "video" | "photo";

type MediaItem = {
  id: string;
  type: MediaType;
  title: string;
  subtitle: string | null;
  external_url: string | null;
  file_path: string | null;
  thumb_path: string | null;
  sort_order: number;
};

type CarouselConfig = {
  carouselId: string;
  indicatorsId: string;
  innerId: string;
  items: MediaItem[];
  type: MediaType;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getStorageUrl(path: string | null): string {
  if (!path) {
    return "";
  }

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

function toEmbedUrl(input: string): string {
  try {
    const parsed = new URL(input);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        if (id) {
          return `https://www.youtube.com/embed/${id}`;
        }
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.toString();
      }
    }

    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "");
      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }

    if (host === "vimeo.com") {
      const id = parsed.pathname.replace(/^\//, "");
      if (id) {
        return `https://player.vimeo.com/video/${id}`;
      }
    }

    return parsed.toString();
  } catch {
    return input;
  }
}

function renderComingSoon(config: CarouselConfig) {
  const indicators = document.getElementById(config.indicatorsId);
  const inner = document.getElementById(config.innerId);
  const carousel = document.getElementById(config.carouselId);

  if (!(indicators instanceof HTMLElement) || !(inner instanceof HTMLElement) || !(carousel instanceof HTMLElement)) {
    return;
  }

  indicators.innerHTML = `
    <button type="button" data-bs-target="#${config.carouselId}" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
  `;

  inner.innerHTML = `
    <div class="carousel-item active">
      <div class="d-flex align-items-center justify-content-center py-5 text-muted small">Coming soon</div>
    </div>
  `;

  carousel.querySelectorAll(".carousel-control-prev, .carousel-control-next").forEach((element) => {
    if (element instanceof HTMLElement) {
      element.classList.add("d-none");
    }
  });
}

function createItemMarkup(item: MediaItem, type: MediaType, index: number): string {
  const title = escapeHtml(item.title);
  const subtitle = item.subtitle ? `<p class="text-muted mb-3">${escapeHtml(item.subtitle)}</p>` : "";
  const thumbUrl = getStorageUrl(item.thumb_path || item.file_path);
  const thumbAlt = title || "Media item";
  const safeThumb = escapeHtml(thumbUrl);

  if (type === "audio") {
    const audioUrl = escapeHtml(getStorageUrl(item.file_path));
    return `
      <img src="${safeThumb}" alt="${thumbAlt}" class="d-block w-100" />
      <div class="carousel-caption d-md-block">
        <h5>${title}</h5>
        ${subtitle}
        <button class="btn btn-light" type="button" data-media-action="play-audio" data-audio-src="${audioUrl}" data-title="${title}">Play</button>
      </div>
    `;
  }

  if (type === "video") {
    const videoUrl = escapeHtml(item.external_url ? toEmbedUrl(item.external_url) : "");
    return `
      <img src="${safeThumb}" alt="${thumbAlt}" class="d-block w-100" />
      <div class="carousel-caption d-md-block">
        <h5>${title}</h5>
        ${subtitle}
        <button class="btn btn-light" type="button" data-media-action="watch-video" data-video-src="${videoUrl}" data-title="${title}">Watch</button>
      </div>
    `;
  }

  const imageUrl = escapeHtml(getStorageUrl(item.file_path));
  return `
    <button class="btn p-0 border-0 bg-transparent w-100" type="button" data-media-action="open-image" data-image-src="${imageUrl}" data-title="${title}" data-gallery-index="${index}">
      <img src="${safeThumb}" alt="${thumbAlt}" class="d-block w-100" />
    </button>
    <div class="carousel-caption d-md-block">
      <h5>${title}</h5>
      ${subtitle}
    </div>
  `;
}

function renderCarousel(config: CarouselConfig) {
  const indicators = document.getElementById(config.indicatorsId);
  const inner = document.getElementById(config.innerId);
  const carousel = document.getElementById(config.carouselId);

  if (!(indicators instanceof HTMLElement) || !(inner instanceof HTMLElement) || !(carousel instanceof HTMLElement)) {
    return;
  }

  if (!config.items.length) {
    renderComingSoon(config);
    return;
  }

  indicators.innerHTML = config.items
    .map(
      (_, index) => `
      <button
        type="button"
        data-bs-target="#${config.carouselId}"
        data-bs-slide-to="${index}"
        class="${index === 0 ? "active" : ""}"
        ${index === 0 ? 'aria-current="true"' : ""}
        aria-label="Slide ${index + 1}"
      ></button>
    `,
    )
    .join("");

  inner.innerHTML = config.items
    .map(
      (item, index) => `
      <div class="carousel-item ${index === 0 ? "active" : ""}">
        ${createItemMarkup(item, config.type, index)}
      </div>
    `,
    )
    .join("");

  carousel.querySelectorAll(".carousel-control-prev, .carousel-control-next").forEach((element) => {
    if (element instanceof HTMLElement) {
      element.classList.toggle("d-none", config.items.length <= 1);
    }
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  const audioModalElement = document.getElementById("audioModal");
  const audioPlayer = document.getElementById("audioModalPlayer");
  const audioModalTitle = document.getElementById("audioModalTitle");

  const videoModalElement = document.getElementById("videoModal");
  const videoFrame = document.getElementById("videoModalFrame");
  const videoModalTitle = document.getElementById("videoModalTitle");

  const galleryModalElement = document.getElementById("galleryModal");
  const galleryModalBody = document.getElementById("galleryModalBody");
  const galleryImage = document.getElementById("galleryModalImage");
  const galleryModalTitle = document.getElementById("galleryModalTitle");
  const galleryPrevButton = document.getElementById("galleryPrevButton");
  const galleryNextButton = document.getElementById("galleryNextButton");

  if (
    !(audioModalElement instanceof HTMLElement) ||
    !(audioPlayer instanceof HTMLAudioElement) ||
    !(audioModalTitle instanceof HTMLElement) ||
    !(videoModalElement instanceof HTMLElement) ||
    !(videoFrame instanceof HTMLIFrameElement) ||
    !(videoModalTitle instanceof HTMLElement) ||
    !(galleryModalElement instanceof HTMLElement) ||
    !(galleryModalBody instanceof HTMLElement) ||
    !(galleryImage instanceof HTMLImageElement) ||
    !(galleryModalTitle instanceof HTMLElement) ||
    !(galleryPrevButton instanceof HTMLButtonElement) ||
    !(galleryNextButton instanceof HTMLButtonElement)
  ) {
    return;
  }

  const bootstrapRef = (window as unknown as { bootstrap?: { Modal: { getOrCreateInstance: (element: HTMLElement) => { show: () => void; hide: () => void } } } }).bootstrap;
  if (!bootstrapRef?.Modal) {
    return;
  }

  const audioModal = bootstrapRef.Modal.getOrCreateInstance(audioModalElement);
  const videoModal = bootstrapRef.Modal.getOrCreateInstance(videoModalElement);
  const galleryModal = bootstrapRef.Modal.getOrCreateInstance(galleryModalElement);

  const { data, error } = await supabase
    .from("media_items")
    .select("id, type, title, subtitle, external_url, file_path, thumb_path, sort_order")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    renderComingSoon({
      carouselId: "audioCarousel",
      indicatorsId: "audioCarouselIndicators",
      innerId: "audioCarouselInner",
      items: [],
      type: "audio",
    });
    renderComingSoon({
      carouselId: "videoCarousel",
      indicatorsId: "videoCarouselIndicators",
      innerId: "videoCarouselInner",
      items: [],
      type: "video",
    });
    renderComingSoon({
      carouselId: "galleryCarousel",
      indicatorsId: "galleryCarouselIndicators",
      innerId: "galleryCarouselInner",
      items: [],
      type: "photo",
    });
    return;
  }

  const rows = (data ?? []) as MediaItem[];
  const audioItems = rows.filter((row) => row.type === "audio");
  const videoItems = rows.filter((row) => row.type === "video");
  const photoItems = rows.filter((row) => row.type === "photo");
  let currentGalleryIndex = -1;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchActive = false;

  function setGalleryNavState() {
    const hasMultiplePhotos = photoItems.length > 1;
    galleryPrevButton.disabled = !hasMultiplePhotos;
    galleryNextButton.disabled = !hasMultiplePhotos;
  }

  function showGalleryImage(index: number) {
    if (!photoItems.length) {
      return;
    }

    const normalizedIndex = (index + photoItems.length) % photoItems.length;
    const item = photoItems[normalizedIndex];
    const imageSrc = getStorageUrl(item.file_path);

    if (!imageSrc) {
      return;
    }

    currentGalleryIndex = normalizedIndex;
    galleryImage.src = imageSrc;
    galleryModalTitle.textContent = item.title || "Gallery";
    setGalleryNavState();
  }

  renderCarousel({
    carouselId: "audioCarousel",
    indicatorsId: "audioCarouselIndicators",
    innerId: "audioCarouselInner",
    items: audioItems,
    type: "audio",
  });

  renderCarousel({
    carouselId: "videoCarousel",
    indicatorsId: "videoCarouselIndicators",
    innerId: "videoCarouselInner",
    items: videoItems,
    type: "video",
  });

  renderCarousel({
    carouselId: "galleryCarousel",
    indicatorsId: "galleryCarouselIndicators",
    innerId: "galleryCarouselInner",
    items: photoItems,
    type: "photo",
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const actionElement = target.closest("[data-media-action]");
    if (!(actionElement instanceof HTMLElement)) {
      return;
    }

    const action = actionElement.dataset.mediaAction;

    if (action === "play-audio") {
      const src = actionElement.dataset.audioSrc || "";
      if (!src) {
        return;
      }

      audioPlayer.src = src;
      audioModalTitle.textContent = actionElement.dataset.title || "Audio";
      audioModal.show();
      return;
    }

    if (action === "watch-video") {
      const src = actionElement.dataset.videoSrc || "";
      if (!src) {
        return;
      }

      videoFrame.src = src;
      videoModalTitle.textContent = actionElement.dataset.title || "Video";
      videoModal.show();
      return;
    }

    if (action === "open-image") {
      const indexValue = Number.parseInt(actionElement.dataset.galleryIndex || "", 10);
      if (!Number.isInteger(indexValue)) {
        return;
      }

      showGalleryImage(indexValue);
      galleryModal.show();
    }
  });

  galleryPrevButton.addEventListener("click", () => {
    if (currentGalleryIndex < 0) {
      return;
    }

    showGalleryImage(currentGalleryIndex - 1);
  });

  galleryNextButton.addEventListener("click", () => {
    if (currentGalleryIndex < 0) {
      return;
    }

    showGalleryImage(currentGalleryIndex + 1);
  });

  document.addEventListener("keydown", (event) => {
    if (!galleryModalElement.classList.contains("show") || currentGalleryIndex < 0) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showGalleryImage(currentGalleryIndex - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showGalleryImage(currentGalleryIndex + 1);
    }
  });

  galleryModalBody.addEventListener(
    "touchstart",
    (event) => {
      if (!galleryModalElement.classList.contains("show") || photoItems.length <= 1) {
        return;
      }

      if (event.touches.length !== 1) {
        touchActive = false;
        return;
      }

      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      touchActive = true;
    },
    { passive: true },
  );

  galleryModalBody.addEventListener(
    "touchend",
    (event) => {
      if (!touchActive || !galleryModalElement.classList.contains("show") || currentGalleryIndex < 0) {
        return;
      }

      const touch = event.changedTouches[0];
      if (!touch) {
        touchActive = false;
        return;
      }

      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const horizontalThreshold = 48;

      if (Math.abs(deltaX) >= horizontalThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        if (deltaX < 0) {
          showGalleryImage(currentGalleryIndex + 1);
        } else {
          showGalleryImage(currentGalleryIndex - 1);
        }
      }

      touchActive = false;
    },
    { passive: true },
  );

  audioModalElement.addEventListener("hidden.bs.modal", () => {
    audioPlayer.pause();
    audioPlayer.removeAttribute("src");
    audioPlayer.load();
  });

  videoModalElement.addEventListener("hidden.bs.modal", () => {
    videoFrame.src = "about:blank";
  });

  galleryModalElement.addEventListener("hidden.bs.modal", () => {
    galleryImage.removeAttribute("src");
    currentGalleryIndex = -1;
    touchActive = false;
  });
});
