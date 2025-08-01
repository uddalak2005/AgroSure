import {toast} from 'react-toastify';

export const showToast = (props) => {
  toast.success(<strong>{props.success}</strong>, {
    position: 'top-right',
  });
}

export const showError = (props) => {
  toast.error(<strong>{props.err}</strong>, {
    position: 'top-right',
  });
}
  