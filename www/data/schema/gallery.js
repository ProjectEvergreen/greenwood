const gql = require('graphql-tag');

const getGallery = async (root, query, context) => {
  return [{
    name: 'Gallery 1',
    title: 'Gallery Title',
    images: [{
      path: '/assets/gallery1/image1.png'
    }, {
      path: '/assets/gallery1/image2.png'
    }]
  }];
};

const galleryTypeDefs = gql`
  type Image {
    path: String
  }

  type Gallery {
    name: String,
    title: String,
    images: [Image]
  }

  extend type Query {
    gallery: [Gallery]
  }
`;

const galleryResolvers = {
  Query: {
    gallery: getGallery
  }
};

module.exports = {
  customTypeDefs: galleryTypeDefs,
  customResolvers: galleryResolvers
};