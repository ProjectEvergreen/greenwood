const gql = require('graphql-tag');

const getGallery = async (root, query) => {
  if (query.name === 'logos') {
    return [{
      name: 'logos',
      title: 'Home Page Logos',
      images: [{
        path: '/assets/webcomponents.svg'
      }, {
        path: '/assets/nodejs.png'
      }, {
        path: '/assets/simple.png'
      }]
    }];
  } else {
    return [{
      name: 'Gallery 1',
      title: 'Gallery Title',
      images: [{
        path: '/assets/gallery1/image1.png'
      }, {
        path: '/assets/gallery1/image2.png'
      }]
    }];
  }
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
    gallery(name: String!): [Gallery]
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