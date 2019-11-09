import axios from 'axios';
import gql from 'graphql-tag';

export const getCache = (url) => {
  return axios.get(url).then((res) => res.data).catch(() => false);
};

export const GET_MENU = gql`
  query($name: String!) {
    getMenu(name: $name) {
      name
      items {
        name
        path
      },
    }
  }
`;