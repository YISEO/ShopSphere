import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { useStoreContext } from "../utils/GlobalState";

import InputField from "../components/InputField";
import { UPDATE_PRODUCTS, UPDATE_USER } from "../utils/actions";
import { QUERY_USER, QUERY_PRODUCTS } from "../utils/queries";
import { CREATE_PRODUCT } from "../utils/mutations";
import { idbPromise } from "../utils/helpers";
import Axios from "axios";

import toast from "react-hot-toast";

function ProductPost() {
  const navigate = useNavigate();

  const fields = [
    { label: "Name", name: "name", type: "text", required: true },
    { label: "Price", name: "price", type: "number", required: true },
    { label: "Quantity", name: "quantity", type: "number", required: true },
    { label: "Category", name: "category", type: "select", required: true },
    { label: "Image", name: "image", type: "text", required: true },
    {
      label: "Description",
      name: "description",
      type: "textarea",
      required: true,
    },
  ];

  const [state, dispatch] = useStoreContext();
  const [createProduct] = useMutation(CREATE_PRODUCT);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    image: "",
    category: "",
  });
  const { data: userData } = useQuery(QUERY_USER);
  const [imageFileName, setImageFileName] = useState("Choose a file");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };


  const uploadImage = (files) => {
    const formData = new FormData();
    formData.append("file", files);
    formData.append("upload_preset", "shopsphere");
    formData.append("cloud_name", "dvi14vg6b");

    Axios.post(
      "https://api.cloudinary.com/v1_1/dvi14vg6b/image/upload",
      formData
    ).then((response) =>
      {
        console.log(response);
        setFormData((prevState) => ({
          ...prevState,
          image: response.data.url,
        }))
      
        setImageFileName(response.data.original_filename); // Set the image file name
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if quantity or price is negative
    if (parseFloat(formData.quantity) < 0 || parseInt(formData.price) < 0) {
      toast.error("Quantity and price cannot be negative.");
      return;
    }

    try {
      const { data } = await createProduct({
        variables: {
          input: {
            ...formData,
            price: parseFloat(formData.price),
            quantity: parseInt(formData.quantity),
          },
        },
        refetchQueries: [{ query: QUERY_PRODUCTS }, { query: QUERY_USER }],
      });

      // Update the IndexedDB store
      idbPromise("products", "put", data.createProduct);

      // Dispatch the action to update the local state
      dispatch({
        type: UPDATE_PRODUCTS,
        products: [...state.products, data.createProduct],
      });

      // Update the user's addedProducts with the new product
      dispatch({
        type: UPDATE_USER,
        payload: {
          ...state.user,
          addedProducts: [...state.user.addedProducts, data.createProduct],
        },
      });

      toast.success("Your product has been successfully added!");
      navigate("/mypage");
    } catch (error) {
      console.error("Error creating product:", error.message);
    }
  };

  return (
    <section className="flex flex-col justify-center items-center py-16 pl-2 pr-4">
      <h2 className="text-3xl text-center font-bold">Sell my product</h2>
      <p className="text-center text-lg mt-4">
        Share your eco-friendly product with the world! <br />
        Fill out the form below to get started.
      </p>

      <form
        className="flex flex-row flex-wrap max-w-xl mt-16"
        onSubmit={handleSubmit}
      >
        {fields.map((field) =>
          field.name == "image" ? (
            <>
            <div className="basis-full flex flex-col border border-gray rounded-md px-3 py-2 mt-2 ml-2 file-input">
              <label htmlFor="file" className="cursor-pointer">
                Image<br />
                  <span>{imageFileName}</span>
              </label>
              <input
                type="file"
                id="file"
                className=""
                onChange={(event) => {
                  uploadImage(event.target.files[0]);
                }}
              />
            </div>
            </>
          ) : (
            <InputField
              key={field.name}
              label={field.label}
              name={field.name}
              type={field.type}
              value={formData[field.name]}
              onChange={handleChange}
              required={field.required}
            />
          )
        )}

        <div className="w-full">
          <button
            type="submit"
            className="block mx-auto mt-5 px-10 py-4 bg-olive rounded-lg text-white text-center"
          >
            Submit
          </button>
        </div>
      </form>
    </section>
  );
}

export default ProductPost;
