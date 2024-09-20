import chai from 'chai';
import { graphResolvers } from '../../../src/schema/graph.js';
import { MOCK_GRAPH } from '../mocks/graph.js';

const expect = chai.expect;

describe('Unit Test: Data', function() {

  describe('Schema', function() {

    describe('Graph', function() {

      describe('getMenuFromGraph navigation menu', function() {

        describe('with default sort', function() {
          let navigation = [];

          before(async function() {
            navigation = await graphResolvers.Query.menu(undefined, {
              name: 'navigation'
            }, {
              graph: MOCK_GRAPH.graph,
              config: {
                basePath: ''
              }
            });
          });

          it('should have 4 children', function() {
            expect(navigation.children.length).to.equal(4);
          });

          it('should have About as the first item', function() {
            const item = navigation.children[0].item;

            expect(item.label).to.be.equal('About');
            expect(item.route).to.be.equal('/about/');
          });

          it('should have Docs as the second item', function() {
            const item = navigation.children[1].item;

            expect(item.label).to.be.equal('Docs');
            expect(item.route).to.be.equal('/docs/');
          });

          it('should have Getting Started as the third item', function() {
            const item = navigation.children[2].item;

            expect(item.label).to.be.equal('Getting Started');
            expect(item.route).to.be.equal('/getting-started/');
          });

          it('should have Plugins as the fourth item', function() {
            const item = navigation.children[3].item;

            expect(item.label).to.be.equal('Plugins');
            expect(item.route).to.be.equal('/plugins/');
          });
        });
      });

      describe('getMenuFromGraph filtering by side menu from path /getting-started', function() {
        describe('with no sorting (default)', function() {
          let shelf = [];

          before(async function() {
            shelf = await graphResolvers.Query.menu(undefined, {
              pathname: '/getting-started/',
              name: 'side'
            }, {
              graph: MOCK_GRAPH.graph,
              config: {
                basePath: '/my-app'
              }
            });
          });

          it('should have 7 children', function() {
            expect(shelf.children.length).to.equal(7);
          });

          describe('the first item:', function() {
            it('should be labeled and linked to Styles and Web Components', function() {
              const item = shelf.children[0].item;

              expect(item.label).to.be.equal('Branding');
              expect(item.route).to.be.equal('/getting-started/branding');
            });

            it('should have the correct sub items', function() {
              const subitem = shelf.children[0].children;

              expect(subitem[0].item.label).to.be.equal('Web Components');
              expect(subitem[0].item.route).to.be.equal('#web-components');
              expect(subitem[1].item.label).to.be.equal('CSS');
              expect(subitem[1].item.route).to.be.equal('#css');
            });
          });

          describe('the second item:', function() {
            it('should be labeled and linked to Build And Deploy', function() {
              const item = shelf.children[1].item;

              expect(item.label).to.be.equal('Build And Deploy');
              expect(item.route).to.be.equal('/getting-started/build-and-deploy');
            });
          });

          describe('the third item:', function() {
            it('should be labeled and linked to Creating Content', function() {
              const item = shelf.children[2].item;

              expect(item.label).to.be.equal('Creating Content');
              expect(item.route).to.be.equal('/getting-started/creating-content');
            });

            it('should have the correct sub items', function() {
              const subitem = shelf.children[2].children;
              expect(subitem[0].item.label).to.be.equal('Objectives');
              expect(subitem[1].item.label).to.be.equal('Home Page Layout');
              expect(subitem[2].item.label).to.be.equal('Blog Posts Layout');
              expect(subitem[3].item.label).to.be.equal('Creating Pages');
              expect(subitem[4].item.label).to.be.equal('Development Server');
            });
          });
        });

        describe('with custom front matter index ascending', function() {
          let shelf = [];

          before(async function() {
            shelf = await graphResolvers.Query.menu(undefined, {
              pathname: '/getting-started/',
              name: 'side',
              orderBy: 'index_asc'
            }, {
              graph: MOCK_GRAPH.graph,
              config: {
                basePath: ''
              }
            });
          });

          it('should have 7 children', function() {
            expect(shelf.children.length).to.equal(7);
          });

          describe('the first item:', function() {
            it('should be labeled and linked to Quick Start', function() {
              const item = shelf.children[0].item;

              expect(item.label).to.be.equal('Quick Start');
              expect(item.route).to.be.equal('/getting-started/quick-start');
            });
          });

          describe('the second item:', function() {
            it('should be labeled and linked to Key Concepts', function() {
              const item = shelf.children[1].item;

              expect(item.label).to.be.equal('Key Concepts');
              expect(item.route).to.be.equal('/getting-started/key-concepts');
            });

            it('should have the correct sub items', function() {
              const subitem = shelf.children[1].children;

              expect(subitem[0].item.label).to.be.equal('Workspace');
              expect(subitem[0].item.route).to.be.equal('#workspace');
              expect(subitem[1].item.label).to.be.equal('Layouts');
              expect(subitem[1].item.route).to.be.equal('#layouts');
              expect(subitem[2].item.label).to.be.equal('Pages');
              expect(subitem[2].item.route).to.be.equal('#pages');
            });
          });

          describe('the third item:', function() {
            it('should be labeled and linked to Project Setup', function() {
              const item = shelf.children[2].item;

              expect(item.label).to.be.equal('Project Setup');
              expect(item.route).to.be.equal('/getting-started/project-setup');
            });

            it('should have the correct sub items', function() {
              const subitem = shelf.children[2].children;

              expect(subitem[0].item.label).to.be.equal('Installing Greenwood');
              expect(subitem[0].item.route).to.be.equal('#installing-greenwood');
              expect(subitem[1].item.label).to.be.equal('Configuring Workflows');
              expect(subitem[1].item.route).to.be.equal('#configuring-workflows');
              expect(subitem[2].item.label).to.be.equal('Project Structure');
              expect(subitem[2].item.route).to.be.equal('#project-structure');
            });
          });
        });

        describe('with custom front matter index descending', function() {
          let shelf = [];

          before(async function() {
            shelf = await graphResolvers.Query.menu(undefined, {
              pathname: '/getting-started/',
              name: 'side',
              orderBy: 'index_desc'
            }, {
              graph: MOCK_GRAPH.graph,
              config: {
                basePath: ''
              }
            });
          });

          it('should have 7 children', function() {
            expect(shelf.children.length).to.equal(7);
          });

          describe('the first item:', function() {
            it('should be labeled and linked to Next Steps', function() {
              const item = shelf.children[0].item;

              expect(item.label).to.be.equal('Next Steps');
              expect(item.route).to.be.equal('/getting-started/next-steps');
            });
          });

          describe('the second item:', function() {
            it('should be labeled and linked to Build And Deploy', function() {
              const item = shelf.children[1].item;

              expect(item.label).to.be.equal('Build And Deploy');
              expect(item.route).to.be.equal('/getting-started/build-and-deploy');
            });
          });

          describe('the third item:', function() {
            it('should be labeled and linked to Styles and Web Components', function() {
              const item = shelf.children[2].item;

              expect(item.label).to.be.equal('Branding');
              expect(item.route).to.be.equal('/getting-started/branding');
            });

            it('should have the correct sub items', function() {
              const subitem = shelf.children[2].children;

              expect(subitem[0].item.label).to.be.equal('Web Components');
              expect(subitem[0].item.route).to.be.equal('#web-components');
              expect(subitem[1].item.label).to.be.equal('CSS');
              expect(subitem[1].item.route).to.be.equal('#css');
            });
          });
        });

        describe('with custom front matter title ascending', function() {
          let shelf = [];

          before(async function() {
            shelf = await graphResolvers.Query.menu(undefined, {
              pathname: '/getting-started/',
              name: 'side',
              orderBy: 'title_asc'
            }, {
              graph: MOCK_GRAPH.graph,
              config: {
                basePath: ''
              }
            });
          });

          it('should have 7 children', function() {
            expect(shelf.children.length).to.equal(7);
          });

          describe('the first item:', function() {
            it('should be labeled and linked to Branding', function() {
              const item = shelf.children[0].item;

              expect(item.label).to.be.equal('Branding');
              expect(item.route).to.be.equal('/getting-started/branding');
            });
          });

          describe('the second item:', function() {
            it('should be labeled and linked to Build And Deploy', function() {
              const item = shelf.children[1].item;

              expect(item.label).to.be.equal('Build And Deploy');
              expect(item.route).to.be.equal('/getting-started/build-and-deploy');
            });
          });

          describe('the third item:', function() {
            it('should be labeled and linked to Creating Content', function() {
              const item = shelf.children[2].item;

              expect(item.label).to.be.equal('Creating Content');
              expect(item.route).to.be.equal('/getting-started/creating-content');
            });
          });

          describe('the fourth item:', function() {
            it('should be labeled and linked to Key Concepts', function() {
              const item = shelf.children[3].item;

              expect(item.label).to.be.equal('Key Concepts');
              expect(item.route).to.be.equal('/getting-started/key-concepts');
            });

            it('should have the correct sub items', function() {
              const subitem = shelf.children[3].children;

              expect(subitem[0].item.label).to.be.equal('Workspace');
              expect(subitem[0].item.route).to.be.equal('#workspace');
              expect(subitem[1].item.label).to.be.equal('Layouts');
              expect(subitem[1].item.route).to.be.equal('#layouts');
              expect(subitem[2].item.label).to.be.equal('Pages');
              expect(subitem[2].item.route).to.be.equal('#pages');
            });
          });
        });

        describe('with custom front matter title descending', function() {
          let shelf = [];

          before(async function() {
            shelf = await graphResolvers.Query.menu(undefined, {
              pathname: '/getting-started/',
              name: 'side',
              orderBy: 'title_desc'
            }, {
              graph: MOCK_GRAPH.graph,
              config: {
                basePath: ''
              }
            });
          });

          it('should have 7 children', function() {
            expect(shelf.children.length).to.equal(7);
          });

          describe('the first item:', function() {
            it('should be labeled and linked to Quick Start', function() {
              const item = shelf.children[0].item;

              expect(item.label).to.be.equal('Quick Start');
              expect(item.route).to.be.equal('/getting-started/quick-start');
            });
          });

          describe('the second item:', function() {
            it('should be labeled and linked to Project Setup', function() {
              const item = shelf.children[1].item;

              expect(item.label).to.be.equal('Project Setup');
              expect(item.route).to.be.equal('/getting-started/project-setup');
            });

            it('should have the correct sub items', function() {
              const subitem = shelf.children[1].children;

              expect(subitem[0].item.label).to.be.equal('Installing Greenwood');
              expect(subitem[0].item.route).to.be.equal('#installing-greenwood');
              expect(subitem[1].item.label).to.be.equal('Configuring Workflows');
              expect(subitem[1].item.route).to.be.equal('#configuring-workflows');
              expect(subitem[2].item.label).to.be.equal('Project Structure');
              expect(subitem[2].item.route).to.be.equal('#project-structure');
            });
          });

          describe('the third item:', function() {
            it('should be labeled and linked to Next Steps', function() {
              const item = shelf.children[2].item;

              expect(item.label).to.be.equal('Next Steps');
              expect(item.route).to.be.equal('/getting-started/next-steps');
            });
          });
        });
      });

      describe('getChildrenFromGraph', function() {

        describe('with default sort', function() {
          let data = [];

          before(async function() {
            data = await graphResolvers.Query.children(undefined, {
              parent: '/getting-started'
            }, {
              graph: MOCK_GRAPH.graph,
              config: {
                basePath: '/my-app'
              }
            });
          });

          it('should have 7 children', function() {
            expect(data.length).to.equal(7);
          });

          it('should have Branding as the first item', function() {
            const item = data[0];

            expect(item.label).to.be.equal('Branding');
            expect(item.route).to.be.equal('/getting-started/branding');
          });

          it('should have Build and Deploy as the second item', function() {
            const item = data[1];

            expect(item.label).to.be.equal('Build And Deploy');
            expect(item.route).to.be.equal('/getting-started/build-and-deploy');
          });

          it('should have Creating Content as the third item', function() {
            const item = data[2];

            expect(item.label).to.be.equal('Creating Content');
            expect(item.route).to.be.equal('/getting-started/creating-content');
          });

          it('should have Key Concepts as the fourth item', function() {
            const item = data[3];

            expect(item.label).to.be.equal('Key Concepts');
            expect(item.route).to.be.equal('/getting-started/key-concepts');
          });

          it('should have Next Steps as the fifth item', function() {
            const item = data[4];

            expect(item.label).to.be.equal('Next Steps');
            expect(item.route).to.be.equal('/getting-started/next-steps');
          });

          it('should have Project Setup as the sixth item', function() {
            const item = data[5];

            expect(item.label).to.be.equal('Project Setup');
            expect(item.route).to.be.equal('/getting-started/project-setup');
          });

          it('should have Quick Start as the seventh item', function() {
            const item = data[6];

            expect(item.label).to.be.equal('Quick Start');
            expect(item.route).to.be.equal('/getting-started/quick-start');
          });
        });
      });
    });
  });
});