const mongoose = require("mongoose");
const slugify = require("slugify");

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        subtitle: {
            type: String,
            trim: true,
        },
        content: {
            type: String,
            required: true,
        },
        image: {
            url: {
                type: String,
                required: true,
            },
            public_id: {
                type: String,
            },
        },
        tags: {
            type: [String],
            required: true,
        },
        meta: {
            title: {
                type: String,
                required: [true, "Meta title is required"],
                trim: true,
            },
            description: {
                type: String,
                required: [true, "Meta description is required"],
                maxlength: 160,
            },
            metaTags: {
                type: [String]
            },
            canonicalUrl: {
                type: String,
                trim: true,
            },
        },
        og: {
            title: {
                type: String,
                trim: true,
                maxlength: 60,
            },
            description: {
                type: String,
                trim: true,
                maxlength: 160,
            },
            image: {
                url: String,
                public_id: String,
            },
            type: {
                type: String,
                default: "article",
            },
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        author: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save hook using async/await (Promise-based, no 'next' needed)
blogSchema.pre("validate", async function () {
    if (!this.meta) this.meta = {};
    if (!this.og) this.og = {};

    // 1. Generate slug if not present
    if (this.title && !this.slug) {
        const BlogModel = this.constructor;
        let baseSlug = slugify(this.title, { lower: true, strict: true });
        let slug = baseSlug;
        let count = 0;

        while (await BlogModel.exists({ slug })) {
            count += 1;
            slug = `${baseSlug}-${count}`;
        }
        this.slug = slug;
    }

    // 2. Set default Canonical URL
    if (!this.meta.canonicalUrl && this.slug) {
        this.meta.canonicalUrl = `https://adzifymedia.com/blog/${this.slug}`;
    }

    // 3. Set default metaTags from tags
    if ((!this.meta.metaTags || this.meta.metaTags.length === 0) && this.tags?.length > 0) {
        this.meta.metaTags = this.tags;
    }

    // 4. Default OG fields
    if (!this.og.title && this.meta.title) {
        this.og.title = this.meta.title.substring(0, 60);
    }
    if (!this.og.description && this.meta.description) {
        this.og.description = this.meta.description.substring(0, 160);
    }

    // 5. Default OG Image from main image
    if ((!this.og.image || !this.og.image.url) && this.image?.url) {
        this.og.image = {
            url: this.image.url,
            public_id: this.image.public_id
        };
    }
});

module.exports = mongoose.model("Blog", blogSchema);