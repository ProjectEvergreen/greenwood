const expect = require('chai').expect;
const MOCK_GRAPH = require('../mocks/graph');
const { graphResolvers } = require('../../../../src/data/schema/graph');

describe.only('Unit Test: Data', function() {

  describe('Schema', function() {

    describe('Graph', function() {

      describe('getMenuFromGraph navigation menu', function() {

        describe('with default sort', function() {
          let navigation = [];

          before(async function() {
            navigation = await graphResolvers.Query.menu(undefined, {
              pathname: '/',
              name: 'navigation'
            }, MOCK_GRAPH);
          });

          it('should have 4 children', function() {
            expect(navigation.children.length).to.equal(4);
          });

          it('should have About as the first item', function() {
            const item = navigation.children[0].item;

            expect(item.label).to.be.equal('About');
            expect(item.link).to.be.equal('/about/');
          });

          it('should have Docs as the second item', function() {
            const item = navigation.children[1].item;

            expect(item.label).to.be.equal('Docs');
            expect(item.link).to.be.equal('/docs/');
          });

          it('should have Getting Started as the third item', function() {
            const item = navigation.children[2].item;

            expect(item.label).to.be.equal('Getting Started');
            expect(item.link).to.be.equal('/getting-started/');
          });

          it('should have Plugins as the fourth item', function() {
            const item = navigation.children[3].item;

            expect(item.label).to.be.equal('Plugins');
            expect(item.link).to.be.equal('/plugins/');
          });
        });
      });

      describe('getMenuFromGraph filtering by side menu from path /getting-started', function() {
        describe('with no sorting(default)', function() {
          let shelf = [];

          before(async function() {
            shelf = await graphResolvers.Query.menu(undefined, {
              pathname: '/getting-started/',
              name: 'side'
            }, MOCK_GRAPH);
          });

          it('should have 7 children', function() {
            expect(shelf.children.length).to.equal(7);
          });

          describe('the first item:', function() {
            it('should be labeled and linked to Styles and Web Components', function() {
              const item = shelf.children[0].item;

              expect(item.label).to.be.equal('Styles and Web Components');
              expect(item.link).to.be.equal('/getting-started/branding');
            });

            it('should have the correct sub items', function() {
              const subitem = shelf.children[0].children;

              expect(subitem[0].item.label).to.be.equal('Web Components');
              expect(subitem[0].item.link).to.be.equal('#web-components');
              expect(subitem[1].item.label).to.be.equal('CSS');
              expect(subitem[1].item.link).to.be.equal('#css');
            });
          });

          describe('the second item:', function() {
            it('should be labeled and linked to Build and Deploy', function() {
              const item = shelf.children[1].item;

              expect(item.label).to.be.equal('Build and Deploy');
              expect(item.link).to.be.equal('/getting-started/build-and-deploy');
            });
          });

          describe('the third item:', function() {
            it('should be labeled and linked to Creating Content', function() {
              const item = shelf.children[2].item;

              expect(item.label).to.be.equal('Creating Content');
              expect(item.link).to.be.equal('/getting-started/creating-content');
            });

            it('should have the correct sub items', function() {
              const subitem = shelf.children[2].children;
              expect(subitem[0].item.label).to.be.equal('Objectives');
              expect(subitem[1].item.label).to.be.equal('Home Page Template');
              expect(subitem[2].item.label).to.be.equal('Blog Posts Template');
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
            }, MOCK_GRAPH);
          });

          it('should have 7 children', function() {
            expect(shelf.children.length).to.equal(7);
          });

          describe('the first item:', function() {
            it('should be labeled and linked to Quick Start', function() {
              const item = shelf.children[0].item;

              expect(item.label).to.be.equal('Quick Start');
              expect(item.link).to.be.equal('/getting-started/quick-start');
            });
          });

          describe('the second item:', function() {
            it('should be labeled and linked to Key Concepts', function() {
              const item = shelf.children[1].item;

              expect(item.label).to.be.equal('Key Concepts');
              expect(item.link).to.be.equal('/getting-started/key-concepts');
            });

            it('should have the correct sub items', function() {
              const subitem = shelf.children[1].children;

              expect(subitem[0].item.label).to.be.equal('Workspace');
              expect(subitem[0].item.link).to.be.equal('#workspace');
              expect(subitem[1].item.label).to.be.equal('Templates');
              expect(subitem[1].item.link).to.be.equal('#templates');
              expect(subitem[2].item.label).to.be.equal('Pages');
              expect(subitem[2].item.link).to.be.equal('#pages');
            });
          });

          describe('the third item:', function() {
            it('should be labeled and linked to Project Setup', function() {
              const item = shelf.children[2].item;

              expect(item.label).to.be.equal('Project Setup');
              expect(item.link).to.be.equal('/getting-started/project-setup');
            });

            it('should have the correct sub items', function() {
              const subitem = shelf.children[2].children;

              expect(subitem[0].item.label).to.be.equal('Installing Greenwood');
              expect(subitem[0].item.link).to.be.equal('#installing-greenwood');
              expect(subitem[1].item.label).to.be.equal('Configuring Workflows');
              expect(subitem[1].item.link).to.be.equal('#configuring-workflows');
              expect(subitem[2].item.label).to.be.equal('Project Structure');
              expect(subitem[2].item.link).to.be.equal('#project-structure');
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
            }, MOCK_GRAPH);
          });

          it('should have 7 children', function() {
            expect(shelf.children.length).to.equal(7);
          });

          describe('the first item:', function() {
            it('should be labeled and linked to Next Steps', function() {
              const item = shelf.children[0].item;

              expect(item.label).to.be.equal('Next Steps');
              expect(item.link).to.be.equal('/getting-started/next-steps');
            });
          });

          describe('the second item:', function() {
            it('should be labeled and linked to Build and Deploy', function() {
              const item = shelf.children[1].item;

              expect(item.label).to.be.equal('Build and Deploy');
              expect(item.link).to.be.equal('/getting-started/build-and-deploy');
            });
          });

          describe('the third item:', function() {
            it('should be labeled and linked to Styles and Web Components', function() {
              const item = shelf.children[2].item;

              expect(item.label).to.be.equal('Styles and Web Components');
              expect(item.link).to.be.equal('/getting-started/branding');
            });

            it('should have the correct sub items', function() {
              const subitem = shelf.children[2].children;

              expect(subitem[0].item.label).to.be.equal('Web Components');
              expect(subitem[0].item.link).to.be.equal('#web-components');
              expect(subitem[1].item.label).to.be.equal('CSS');
              expect(subitem[1].item.link).to.be.equal('#css');
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
            }, MOCK_GRAPH);
          });

          it('should have 7 children', function() {
            expect(shelf.children.length).to.equal(7);
          });

          describe('the first item:', function() {
            it('should be labeled and linked to Build and Deploy', function() {
              const item = shelf.children[0].item;

              expect(item.label).to.be.equal('Build and Deploy');
              expect(item.link).to.be.equal('/getting-started/build-and-deploy');
            });
          });

          describe('the second item:', function() {
            it('should be labeled and linked to Creating Content', function() {
              const item = shelf.children[1].item;

              expect(item.label).to.be.equal('Creating Content');
              expect(item.link).to.be.equal('/getting-started/creating-content');
            });
          });

          describe('the third item:', function() {
            it('should be labeled and linked to Key Concepts', function() {
              const item = shelf.children[2].item;

              expect(item.label).to.be.equal('Key Concepts');
              expect(item.link).to.be.equal('/getting-started/key-concepts');
            });

            it('should have the correct sub items', function() {
              const subitem = shelf.children[2].children;

              expect(subitem[0].item.label).to.be.equal('Workspace');
              expect(subitem[0].item.link).to.be.equal('#workspace');
              expect(subitem[1].item.label).to.be.equal('Templates');
              expect(subitem[1].item.link).to.be.equal('#templates');
              expect(subitem[2].item.label).to.be.equal('Pages');
              expect(subitem[2].item.link).to.be.equal('#pages');
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
            }, MOCK_GRAPH);
          });

          it('should have 7 children', function() {
            expect(shelf.children.length).to.equal(7);
          });

          describe('the first item:', function() {
            it('should be labeled and linked to Styles and Web Components', function() {
              const item = shelf.children[0].item;

              expect(item.label).to.be.equal('Styles and Web Components');
              expect(item.link).to.be.equal('/getting-started/branding');
            });

            it('should have the correct sub items', function() {
              const subitem = shelf.children[0].children;

              expect(subitem[0].item.label).to.be.equal('Web Components');
              expect(subitem[0].item.link).to.be.equal('#web-components');
              expect(subitem[1].item.label).to.be.equal('CSS');
              expect(subitem[1].item.link).to.be.equal('#css');
            });
          });

          describe('the second item:', function() {
            it('should be labeled and linked to Quick Start', function() {
              const item = shelf.children[1].item;

              expect(item.label).to.be.equal('Quick Start');
              expect(item.link).to.be.equal('/getting-started/quick-start');
            });
          });

          describe('the third item:', function() {
            it('should be labeled and linked to Project Setup', function() {
              const item = shelf.children[2].item;

              expect(item.label).to.be.equal('Project Setup');
              expect(item.link).to.be.equal('/getting-started/project-setup');
            });

            it('should have the correct sub items', function() {
              const subitem = shelf.children[2].children;

              expect(subitem[0].item.label).to.be.equal('Installing Greenwood');
              expect(subitem[0].item.link).to.be.equal('#installing-greenwood');
              expect(subitem[1].item.label).to.be.equal('Configuring Workflows');
              expect(subitem[1].item.link).to.be.equal('#configuring-workflows');
              expect(subitem[2].item.label).to.be.equal('Project Structure');
              expect(subitem[2].item.link).to.be.equal('#project-structure');
            });
          });
        });
      });
    });
  });
});