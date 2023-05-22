import React from 'react';
import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from 'polotno';

import { autorun } from 'mobx';
import { observer } from 'mobx-react-lite';

import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/popover2/lib/css/blueprint-popover2.css';
import { InputGroup } from '@blueprintjs/core';
import { Button } from '@blueprintjs/core';

import { Workspace } from 'polotno/canvas/workspace';
import { SidePanel, SectionTab } from 'polotno/side-panel';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { createStore } from 'polotno/model/store';
import { DownloadButton } from 'polotno/toolbar/download-button';

import { DEFAULT_SECTIONS } from 'polotno/side-panel';
import api from '../commonJS/api';
import { useNavigate } from 'react-router-dom';

// create store
const store = createStore({
  // this is a demo key just for that project
  // (!) please don't use it in your projects
  // to create your own API key please go here: https://polotno.dev/cabinet
  key: 'EH5scaxDms-nGG_gATVu',
  // you can hide back-link on a paid license
  // but it will be good if you can keep it for Polotno project support
  showCredit: true,
});
// add to global namespace for debugging
window.store = store;

// add page and element instantly
const page = store.addPage();
page.set({
  width: 500,
  height: 500
})

store.activePage.addElement({
  type: 'text',
  text: 'Hello AkoLetter',
  y: 100,
  x: 0,
  width: 500,
  fontSize: 50,
});



export const Editor = (props) => {
  const navigate = useNavigate();
  const CustomSection = {
    name: 'custom-text',
    // we don't need "Tab" property, because it will be hidden from the list
    visibleInList: false,
    // we need observer to update component automatically on any store changes
    Panel: observer(({ store }) => {
      const text = store.selectedElements[0]?.text;
      return (
        <div>
          <InputGroup
            value={text}
            onChange={(e) => {
              store.selectedElements[0]?.set({ text: e.target.value });
            }}
          />
        </div>
      );
    }),
  };
  
  const NewsSection = {
    name: 'news-section',
    Tab: (props) => (
      <SectionTab name="News" {...props}>
        <span className="material-symbols-outlined" style={{fontSize: '16px', transform: 'translateY(5px) scale(1.4)'}}>
        feed
        </span>
      </SectionTab>
    ),
  
    Panel: observer(() => {
      return (
        <div style={{height: '100%', overflow:'scroll'}}>
              <h2 style={{lineHeight: '25px'}}>요약</h2> 
              <p>
                {props.formData.summary}
              </p>
              <br /> 
              <h2 style={{lineHeight: '35px'}}>{props.formData.title}</h2>
              <p>
              {props.formData.content}
              </p>
              
            </div>
      );
    }),
  };

// add new section
  const sections = [NewsSection, ...DEFAULT_SECTIONS.slice(0, 7), CustomSection];

  React.useEffect(() => {
    return autorun(() => {
      const textSelected = store.selectedElements[0]?.type === 'text';
      if (textSelected) {
        store.openSidePanel('custom-text');
      } else {
        store.openSidePanel('news-section');
      }
    });
  }, []);

  // Save 버튼
  const ActionControls = ({ store }) => {
    return (
      <div>
        <DownloadButton store={store} />
        <Button
          intent="primary"
          onClick={() => {
            store.toBlob().then(blob=>{
              const formDataForSubmit = new FormData();
              const chunks = [];
              const numberOfSlices = 3;
              const chunkSize = Math.ceil(blob.size / numberOfSlices);
              for (let i = 0; i < numberOfSlices; i += 1) {
                const startByte = chunkSize * i;
                chunks.push(
                  blob.slice(
                    startByte,
                    startByte + chunkSize,
                    blob.type
                  )
                );
              }

              formDataForSubmit.append('request', {
                postTitle: props.formData.title,
                postContent: props.formData.content,
                category: props.formData.category,
                usrId: sessionStorage.getItem('usrId')                
              }, "application/json")

              for(let i=0; i<chunks.length; i++){
                formDataForSubmit.append('files', new File([chunks[i]], `cardnews${i}.png`), "image/png");
              }

              console.log(formDataForSubmit.getAll('files'))
              api.requestSavePost(formDataForSubmit)
                .then(res=>res.data)
                .then(data=>{
                  console.log(data)
                })
            })
          }}
        >
          Save
        </Button>
      </div>
    );
  };

  return (
    <PolotnoContainer className="polotno-app-container" style={{width: '100vw', height: '100vh'}}>
      <SidePanelWrap style={{ }}>
        <SidePanel store={store} sections={sections} style={{}}/>
      </SidePanelWrap>
      <WorkspaceWrap style={{width: '100vw', height:'100vh'}}>
        <Toolbar store={store} style={{padding: '0'}} components={{ActionControls}}/>
        <Workspace store={store} style={{}}/>
        <ZoomButtons store={store} />
      </WorkspaceWrap>
    </PolotnoContainer>
  );
};

export default Editor;